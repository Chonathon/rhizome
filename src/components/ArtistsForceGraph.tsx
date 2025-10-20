import {Artist, NodeLink} from "@/types";
import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import ForceGraph, {GraphData, ForceGraphMethods} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";
import { drawCircleNode, drawLabelBelow, labelAlphaForZoom, collideRadiusForNode, DEFAULT_LABEL_FADE_START, DEFAULT_LABEL_FADE_END, LABEL_FONT_SIZE, applyMobileDrawerYOffset, LABEL_FONT_MAX_PX, LABEL_FONT_MIN_PX, DEFAULT_DIM_NODE_ALPHA, DEFAULT_DIM_LABEL_ALPHA, DEFAULT_BASE_LINK_ALPHA, DEFAULT_HIGHLIGHT_LINK_ALPHA, DEFAULT_DIM_LINK_ALPHA, DEFAULT_DIM_HOVER_ENABLED, DEFAULT_TOUCH_TARGET_PADDING_PX, DEFAULT_SHOW_NODE_TOOLTIP, HOVERED_LABEL_MIN_ALPHA, alphaToHex, createNodeLabelAccessor, updateDimFactorAnimation } from "@/lib/graphStyle";
import * as d3 from 'd3-force';

export type GraphHandle = {
    zoomIn: () => void;
    zoomOut: () => void;
    zoomTo: (k: number, ms?: number) => void;
    getZoom: () => number;
}

interface ArtistsForceGraphProps {
    artists: Artist[];
    artistLinks: NodeLink[];
    onNodeClick: (artist: Artist) => void;
    loading: boolean;
    show: boolean;
    // Selected artist id to highlight and focus
    selectedArtistId?: string;
    computeArtistColor: (artist: Artist) => string;
    // Use curved links only when the number of rendered links is at or below this threshold.
    // If exceeded, links are straight (0 curvature) to improve performance.
    curvedLinksAbove?: number;
    // Curvature amount to use when under the threshold.
    curvedLinkCurvature?: number;
    // Hide links when zoomed out below this k (0..1 typical). Default 0.35.
    hideLinksBelowZoom?: number;
    // Label fade-in start/end zoom thresholds.
    // Below start → fully transparent, above end → fully opaque.
    labelFadeInStart?: number; // Default 0.7
    labelFadeInEnd?: number;   // Default 1.1
    // When link count exceeds this, hide links until zoomed in past hideLinksBelowZoom*1.25. Default 6000.
    maxLinksToShow?: number;
    // Minimum label size (in pixels) to draw. Default 8.
    minLabelPx?: number;
    // Minimum size at which to draw the halo stroke. Default 13.
    strokeMinPx?: number;
    // Explicit size for the canvas (viewport)
    width?: number;
    height?: number;
    // Node size scaling exponent. Higher values = more differential between popular/unpopular artists.
    // Default 1.2. Try values between 1.0 (linear) and 3.0 (very aggressive).
    nodeSizeScale?: number;
    // Minimum node radius. Default 1.5.
    minNodeSize?: number;
    // Maximum node radius. Default 20.
    maxNodeSize?: number;
    showNodeTooltip?: boolean;
}

const INITIAL_DECAY = 0.75;
const STABLE_DECAY = 0.92;

const ArtistsForceGraph = forwardRef<GraphHandle, ArtistsForceGraphProps>(({
    artists,
    artistLinks,
    onNodeClick,
    loading,
    show,
    selectedArtistId,
    computeArtistColor,
    curvedLinksAbove = 1500,
    curvedLinkCurvature = 0.2,
    hideLinksBelowZoom = 0.1,
    labelFadeInStart = DEFAULT_LABEL_FADE_START,
    labelFadeInEnd = DEFAULT_LABEL_FADE_END,
    maxLinksToShow = 6000,
    minLabelPx = LABEL_FONT_MIN_PX,
    strokeMinPx = 13,
    width,
    height,
    nodeSizeScale = 2,
    minNodeSize = 8,
    maxNodeSize = 30,
    showNodeTooltip = DEFAULT_SHOW_NODE_TOOLTIP,
}, ref) => {
    const { theme } = useTheme();

    const preparedData: GraphData<Artist, NodeLink> = useMemo(() => {
        if (!artists || !artistLinks) return { nodes: [], links: [] };

        // Clone nodes shallowly so FG's runtime props don't leak back upstream.
        const nodes = artists.map(n => ({ ...n }));
        // Clone links and normalize source/target to ids if FG already mutated them.
        const links = artistLinks.map((l) => {
            const src: any = (l as any).source;
            const tgt: any = (l as any).target;
            return {
                source: typeof src === 'string' ? src : src?.id,
                target: typeof tgt === 'string' ? tgt : tgt?.id,
                linkType: l.linkType,
            } as NodeLink;
        });

        return { nodes, links };
    }, [artists, artistLinks]);

    const fgRef = useRef<ForceGraphMethods<Artist, NodeLink> | undefined>(undefined);
    const zoomRef = useRef<number>(1);
    const [velocityDecay, setVelocityDecay] = useState<number>(INITIAL_DECAY);
    const hasStabilizedRef = useRef<boolean>(false);
    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
    const prevHoveredRef = useRef<string | undefined>(undefined);
    const yOffsetByIdRef = useRef<Map<string, number>>(new Map());
    const animRafRef = useRef<number | null>(null);
    const dimFactorRef = useRef<Map<string, number>>(new Map());
    const dimAnimRafRef = useRef<number | null>(null);

    // Expose simple zoom API to parent
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            const cur = zoomRef.current || 1;
            const target = Math.min(20, cur * 2.2);
            fgRef.current?.zoom?.(target, 400);
        },
        zoomOut: () => {
            const cur = zoomRef.current || 1;
            const target = Math.max(0.03, cur / 2.2);
            fgRef.current?.zoom?.(target, 400);
        },
        zoomTo: (k: number, ms = 400) => {
            const target = Math.max(0.03, Math.min(20, k));
            fgRef.current?.zoom?.(target, ms);
        },
        getZoom: () => zoomRef.current || 1,
    }), []);

    // Animate label y-offset on hover using simple easing
    useEffect(() => {
        const prev = prevHoveredRef.current;
        const next = hoveredId;
        prevHoveredRef.current = hoveredId;

        // Targets: hovered -> 4, previous -> 0
        const targets = new Map<string, number>();
        if (typeof prev === 'string' && prev !== next) targets.set(prev, 0);
        if (typeof next === 'string') targets.set(next, 4);

        if (targets.size === 0) return;

        const ease = (current: number, target: number) => current + (target - current) * 0.2;
        const step = () => {
            let anyMoving = false;
            const map = yOffsetByIdRef.current;
            targets.forEach((target, id) => {
                const cur = map.get(id) || 0;
                const nxt = ease(cur, target);
                map.set(id, nxt);
                if (Math.abs(nxt - target) > 0.1) anyMoving = true;
            });
            // Request re-draw
            fgRef.current?.refresh?.();
            if (anyMoving) {
                animRafRef.current = requestAnimationFrame(step);
            } else {
                // Snap to targets at end
                targets.forEach((t, id) => yOffsetByIdRef.current.set(id, t));
                animRafRef.current = null;
                fgRef.current?.refresh?.();
            }
        };

        if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
        animRafRef.current = requestAnimationFrame(step);
        return () => {
            if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
            animRafRef.current = null;
        };
    }, [hoveredId]);

    useEffect(() => {
        setVelocityDecay(prev => (prev === INITIAL_DECAY ? prev : INITIAL_DECAY));
        hasStabilizedRef.current = false;

        if (!fgRef.current) return;

        // Mirror Genre force tuning so both graphs feel consistent
        const chargeStrength = -130;
        const linkDistance = 200;
        const linkStrength = 0.6;
        const centerStrength = .05;
        const collideStrength = 0.4;

        fgRef.current.d3Force('charge')?.strength(chargeStrength);
        fgRef.current.d3Force('link')?.distance(linkDistance);
        fgRef.current.d3Force('link')?.strength(linkStrength);
        fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(centerStrength));

        // Collide force with iterations to better resolve overlaps
        fgRef.current.d3Force('collide', d3.forceCollide((node: any) => {
            const a = node as Artist;
            return collideRadiusForNode(a.name, radiusFor(a));
        }).iterations(2));
        fgRef.current.d3Force('collide')?.strength(collideStrength);

        // Reheat the simulation when data or visibility changes
        fgRef.current.d3ReheatSimulation?.();
        fgRef.current.d3VelocityDecay?.(INITIAL_DECAY);
        const isMobile = window.matchMedia('(max-width: 640px)').matches
        fgRef.current.zoom(isMobile ? 0.12 : 0.18)
    }, [preparedData, show]);

    // Build adjacency map for quick 1-hop neighbor lookup
    const neighborsById = useMemo(() => {
        const m = new Map<string, Set<string>>();
        preparedData.nodes.forEach(n => m.set(n.id, new Set()));
        preparedData.links.forEach(l => {
            const s = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
            const t = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
            if (!s || !t) return;
            if (!m.has(s)) m.set(s, new Set());
            if (!m.has(t)) m.set(t, new Set());
            m.get(s)!.add(t);
            m.get(t)!.add(s);
        });
        return m;
    }, [preparedData]);

    const activeSourceIds = useMemo(() => {
        if (selectedArtistId) return [selectedArtistId];
        if (DEFAULT_DIM_HOVER_ENABLED && hoveredId) return [hoveredId];
        return [];
    }, [selectedArtistId, hoveredId]);

    const activeSourceSet = useMemo(() => new Set(activeSourceIds), [activeSourceIds]);

    const activeNeighborIds = useMemo(() => {
        const set = new Set<string>();
        activeSourceIds.forEach(id => {
            neighborsById.get(id)?.forEach(neighbor => set.add(neighbor));
        });
        return set;
    }, [activeSourceIds, neighborsById]);

    useEffect(() => {
        const enableDimming = Boolean(selectedArtistId) || DEFAULT_DIM_HOVER_ENABLED;
        const cleanup = updateDimFactorAnimation({
            nodeIds: preparedData.nodes.map(n => n.id),
            activeSourceIds,
            activeNeighborIds,
            dimFactorRef,
            animationRef: dimAnimRafRef,
            refresh: () => fgRef.current?.refresh?.(),
            enableDimming,
        });
        return cleanup;
    }, [preparedData.nodes, activeSourceIds, activeNeighborIds, selectedArtistId]);

    // When selection changes, center + zoom to the node
    useEffect(() => {
        if (!show || !selectedArtistId || !fgRef.current) return;
        const node = preparedData.nodes.find(n => n.id === selectedArtistId) as (Artist & {x?: number; y?: number}) | undefined;
        if (!node) return;
        // If positions not yet settled, try shortly after
        const centerToNode = () => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const isMobile = window.matchMedia('(max-width: 640px)').matches;
            const k = zoomRef.current || 1;
            const yAdjusted = applyMobileDrawerYOffset(y, k, isMobile);
            fgRef.current!.centerAt(x, yAdjusted, 600);
            // Choose a friendly zoom level
            const targetK = Math.max(0.8, Math.min(2.2, (zoomRef.current || 1) < 1 ? 1.2 : zoomRef.current));
            fgRef.current!.zoom(targetK, 600);
        };
        // Center now and once again after a tick, in case layout shifts
        centerToNode();
        const t = setTimeout(centerToNode, 300);
        return () => clearTimeout(t);
    }, [selectedArtistId, show, preparedData]);

    // Node radius based on listeners (square root scaling like GenresForceGraph)
    const radiusFor = (artist: Artist) => {
        const listeners = Math.max(1, artist.listeners || 1);
        // Square root provides better differentiation than log
        // nodeSizeScale acts as a multiplier for the sqrt component
        // With coefficient 0.01 and default nodeSizeScale=1.2:
        // - 100k listeners: sqrt(100000) * 0.01 * 1.2 ≈ 3.8
        // - 500k listeners: sqrt(500000) * 0.01 * 1.2 ≈ 8.5
        // - 900k listeners: sqrt(900000) * 0.01 * 1.2 ≈ 11.4
        // - 1.5m listeners: sqrt(1500000) * 0.01 * 1.2 ≈ 14.7
        const calculatedRadius = Math.sqrt(listeners) * (0.01 * nodeSizeScale);
        // Clamp between min and max
        return Math.max(minNodeSize, Math.min(maxNodeSize, calculatedRadius));
    };

    // No label width caching needed for simple pointer area (circular)

    // Precompute per-artist color and adjust for light mode contrast once
    const colorById = useMemo(() => {
        const m = new Map<string, string>();
        preparedData.nodes.forEach(a => {
            m.set(a.id, computeArtistColor(a));
        });
        return m;
    }, [preparedData.nodes, theme]);

    const getArtistColor = (artist: Artist): string => {
        return colorById.get(artist.id) || (theme === 'dark' ? '#8a80ff' : '#4a4a4a');
    };

    const nodeLabelAccessor = useMemo(() => createNodeLabelAccessor<Artist>(showNodeTooltip), [showNodeTooltip]);

    return !show ? null : loading ? (<div className="flex-1 w-full" style={{ height: height ?? '100%' }}>
        <Loading />
    </div>) : (
        (<ForceGraph
            ref={fgRef as any}
            graphData={preparedData}
            width={width}
            height={height}
            // Always show links per request
            linkVisibility={() => true}
            linkColor={(l: any) => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source?.id;
                const targetId = typeof l.target === 'string' ? l.target : l.target?.id;
                const base = (sourceId && colorById.get(sourceId)) || (theme === 'dark' ? '#ffffff' : '#000000');
                if (activeSourceSet.size === 0) {
                    return base + alphaToHex(DEFAULT_BASE_LINK_ALPHA);
                }
                const dimSource = sourceId ? (dimFactorRef.current.get(sourceId) ?? 0) : 0;
                const dimTarget = targetId ? (dimFactorRef.current.get(targetId) ?? 0) : 0;
                const dim = Math.max(dimSource, dimTarget);
                const connectedToHighlight = activeSourceSet.has(sourceId) || activeSourceSet.has(targetId);
                const connectionBaseAlpha = connectedToHighlight ? DEFAULT_HIGHLIGHT_LINK_ALPHA : DEFAULT_BASE_LINK_ALPHA;
                const alpha = DEFAULT_DIM_LINK_ALPHA + (connectionBaseAlpha - DEFAULT_DIM_LINK_ALPHA) * (1 - dim);
                return base + alphaToHex(alpha);
            }}
            linkWidth={(l: any) => {
                if (activeSourceSet.size === 0) return 1;
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                return (activeSourceSet.has(s) || activeSourceSet.has(t)) ? 2.5 : 0.6;
            }}
            linkCurvature={preparedData.links.length <= curvedLinksAbove ? curvedLinkCurvature : 0}
            onNodeClick={onNodeClick}
            onNodeHover={(n: any) => setHoveredId(n ? n.id : undefined)}
            // We'll custom-draw nodes; keep built-in node invisible to avoid double-draw
            nodeColor={() => 'rgba(0,0,0,0)'}
            nodeCanvasObjectMode={() => 'replace'}
            nodeLabel={nodeLabelAccessor}
            d3AlphaDecay={0.01}
            d3VelocityDecay={velocityDecay}
            cooldownTime={10000}
            autoPauseRedraw={false}
            onZoom={({ k }) => { zoomRef.current = k; }}
            onEngineStop={() => {
                if (!hasStabilizedRef.current) {
                    hasStabilizedRef.current = true;
                    fgRef.current?.d3VelocityDecay?.(STABLE_DECAY);
                    setVelocityDecay(STABLE_DECAY);
                }
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const x = node.x || 0;
                const y = node.y || 0;
                const artist = node as Artist;
                const accent = getArtistColor(artist);

                // draw node circle sized by listeners (match GenresForceGraph style)
                const rBase = radiusFor(artist);
                const isSelected = !!selectedArtistId && artist.id === selectedArtistId;
                const isActiveSource = activeSourceSet.has(artist.id);
                const isActiveNeighbor = activeNeighborIds.has(artist.id);
                const hasHighlight = activeSourceIds.length > 0;
                const isHovered = hoveredId === artist.id;
                const r = isSelected ? rBase * 1.4 : rBase;

                const dimFactor = dimFactorRef.current.get(artist.id) ?? 0;
                const fillAlpha = DEFAULT_DIM_NODE_ALPHA + (1 - DEFAULT_DIM_NODE_ALPHA) * (1 - dimFactor);
                const color = accent + alphaToHex(fillAlpha);
                drawCircleNode(ctx, x, y, r, color);

                // Emphasize selection ring
                if (isSelected) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
                    ctx.strokeStyle = accent; // ring matches node color
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.restore();
                }

                // fade-in label opacity based on zoom level; centralized utility
                const k = zoomRef.current || 1;
                let alpha = labelAlphaForZoom(k, labelFadeInStart, labelFadeInEnd);
                if (isActiveSource) alpha = 1;
                else if (isActiveNeighbor) alpha = Math.max(alpha, 0.85);
                else if (hasHighlight) {
                    const dimmedAlpha = DEFAULT_DIM_LABEL_ALPHA + (1 - DEFAULT_DIM_LABEL_ALPHA) * (1 - dimFactor);
                    alpha = Math.min(alpha, dimmedAlpha);
                }
                if (isHovered) {
                    alpha = Math.max(alpha, HOVERED_LABEL_MIN_ALPHA);
                }
                const label = node.name;
                const yOffset = yOffsetByIdRef.current.get(artist.id) || 0;
                drawLabelBelow(ctx, label, x, y, r, theme, alpha, {
                    fontPx: LABEL_FONT_SIZE,
                    yOffsetPx: yOffset,
                    globalScale,
                    minFontPx: minLabelPx,
                    maxFontPx: Math.max(LABEL_FONT_MAX_PX, minLabelPx * 2),
                    scaleWithZoom: true,
                });
            }}
            nodePointerAreaPaint={(node, color, ctx, globalScale) => {
                ctx.fillStyle = color;
                const artist = node as Artist;
                const baseRadius = radiusFor(artist);
                const isSelected = !!selectedArtistId && artist.id === selectedArtistId;
                const drawRadius = isSelected ? baseRadius * 1.4 : baseRadius;
                const scale = Math.max(globalScale || 1, 1e-6);
                const paddingWorld = DEFAULT_TOUCH_TARGET_PADDING_PX / scale;
                const pointerRadius = drawRadius + paddingWorld;
                const nodeX = node.x || 0;
                const nodeY = node.y || 0;
                ctx.beginPath();
                ctx.arc(nodeX, nodeY, pointerRadius, 0, 2 * Math.PI, false);
                ctx.fill();
            }}
            // use nodeVal to increase repulsion for popular artists based on radius
            nodeVal={(n: Artist) => radiusFor(n)}
        />)
    )
});

export default ArtistsForceGraph;
