import {Artist, NodeLink, Tag} from "@/types";
import React, {useEffect, useMemo, useRef, useState} from "react";
import ForceGraph, {GraphData, ForceGraphMethods} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";
import { drawCircleNode, drawLabelBelow, labelAlphaForZoom, collideRadiusForNode, DEFAULT_LABEL_FADE_START, DEFAULT_LABEL_FADE_END, LABEL_FONT_SIZE } from "@/lib/graphStyle";
import * as d3 from 'd3-force';
import {mixColors} from "@/lib/utils";

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
}

const ArtistsForceGraph: React.FC<ArtistsForceGraphProps> = ({
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
    minLabelPx = 8,
    strokeMinPx = 13,
}) => {
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
    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
    const prevHoveredRef = useRef<string | undefined>(undefined);
    const yOffsetByIdRef = useRef<Map<string, number>>(new Map());
    const animRafRef = useRef<number | null>(null);

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
        if (fgRef.current) {
            // Tighter, more lively simulation to prevent dullness
            fgRef.current.d3Force('charge')?.strength(-100);
            fgRef.current.d3Force('link')?.distance(70);
            fgRef.current.d3Force('link')?.strength(0.85);
            fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(0.1));

            // Collide force with iterations to better resolve overlaps
            fgRef.current.d3Force('collide', d3.forceCollide((node: any) => {
                const a = node as Artist;
                return collideRadiusForNode(a.name, radiusFor(a));
            }).iterations(2));
            fgRef.current.d3Force('collide')?.strength(0.7);

            // Reheat the simulation when data or visibility changes
            fgRef.current.d3ReheatSimulation?.();
        }
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

    // When selection changes, center + zoom to the node
    useEffect(() => {
        if (!show || !selectedArtistId || !fgRef.current) return;
        const node = preparedData.nodes.find(n => n.id === selectedArtistId) as (Artist & {x?: number; y?: number}) | undefined;
        if (!node) return;
        // If positions not yet settled, try shortly after
        const centerToNode = () => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            fgRef.current!.centerAt(x, y, 600);
            // Choose a friendly zoom level
            const targetK = Math.max(0.8, Math.min(2.2, (zoomRef.current || 1) < 1 ? 1.2 : zoomRef.current));
            fgRef.current!.zoom(targetK, 600);
        };
        // Center now and once again after a tick, in case layout shifts
        centerToNode();
        const t = setTimeout(centerToNode, 300);
        return () => clearTimeout(t);
    }, [selectedArtistId, show, preparedData]);

    // Precompute listener range (log-scaled) for sizing
    const listenerScale = useMemo(() => {
        const vals = preparedData.nodes.map(a => Math.max(1, a.listeners || 1));
        const min = Math.min(...vals, 1);
        const max = Math.max(...vals, 1);
        const minLog = Math.log10(min);
        const maxLog = Math.log10(max);
        return { minLog, maxLog };
    }, [preparedData]);

    // Node radius based on listeners (log-scaled)
    const radiusFor = (artist: Artist) => {
        const { minLog, maxLog } = listenerScale;
        const v = Math.log10(Math.max(1, artist.listeners || 1));
        const t = (v - minLog) / Math.max(1e-6, (maxLog - minLog));
        const rMin = .2;
        const rMax = 20;
        return rMin + t * (rMax - rMin);
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

    return !show ? null : loading ? (<div className="flex-1 h-[calc(100vh-104px)] w-full">
        <Loading />
    </div>) : (
        (<ForceGraph
            ref={fgRef as any}
            graphData={preparedData}
            // Always show links per request
            linkVisibility={() => true}
            linkColor={(l: any) => {
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                const connectedToSelected = !!selectedArtistId && (s === selectedArtistId || t === selectedArtistId);
                const base = (s && colorById.get(s)) || (theme === 'dark' ? '#ffffff' : '#000000');
                const alpha = selectedArtistId ? (connectedToSelected ? 'ff' : '30') : '80';
                return base + alpha;
            }}
            linkWidth={(l: any) => {
                if (!selectedArtistId) return 1;
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                return (s === selectedArtistId || t === selectedArtistId) ? 2.5 : 0.6;
            }}
            linkCurvature={preparedData.links.length <= curvedLinksAbove ? curvedLinkCurvature : 0}
            onNodeClick={onNodeClick}
            onNodeHover={(n: any) => setHoveredId(n ? n.id : undefined)}
            // We'll custom-draw nodes; keep built-in node invisible to avoid double-draw
            nodeColor={() => 'rgba(0,0,0,0)'}
            nodeCanvasObjectMode={() => 'replace'}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.75}
            cooldownTime={20000}
            autoPauseRedraw={false}
            onZoom={({ k }) => { zoomRef.current = k; }}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const x = node.x || 0;
                const y = node.y || 0;
                const artist = node as Artist;
                const accent = getArtistColor(artist);

                // draw node circle sized by listeners (match GenresForceGraph style)
                const rBase = radiusFor(artist);
                const isSelected = !!selectedArtistId && artist.id === selectedArtistId;
                const isNeighbor = !!selectedArtistId && neighborsById.get(selectedArtistId)?.has(artist.id);
                const r = isSelected ? rBase * 1.4 : rBase;

                // Dim non-neighbors when a selection exists
                const hasSelection = !!selectedArtistId;
                const dimmed = hasSelection && !isSelected && !isNeighbor;
                const color = accent + (dimmed ? '30' : 'ff');
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
                if (isSelected) alpha = 1;
                else if (isNeighbor) alpha = Math.max(alpha, 0.85);
                else if (hasSelection) alpha = Math.min(alpha, 0.2);
                const label = node.name;
                const yOffset = yOffsetByIdRef.current.get(artist.id) || 0;
                drawLabelBelow(ctx, label, x, y, r, theme, alpha, LABEL_FONT_SIZE, yOffset);
            }}
            nodePointerAreaPaint={(node, color, ctx, globalScale) => {
                ctx.fillStyle = color;
                const artist = node as Artist;
                const r = radiusFor(artist) + 24 / (globalScale || 1);
                const nodeX = node.x || 0;
                const nodeY = node.y || 0;
                ctx.beginPath();
                ctx.arc(nodeX, nodeY, r, 0, 2 * Math.PI, false);
                ctx.fill();
            }}
            // use nodeVal to slightly increase repulsion for popular artists
            nodeVal={(n: Artist) => {
                const { minLog, maxLog } = listenerScale;
                const v = Math.log10(Math.max(1, n.listeners || 1));
                const t = (v - minLog) / Math.max(1e-6, (maxLog - minLog));
                return 1 + t * 6; // 1..7
            }}
        />)
    )
}

export default ArtistsForceGraph;
