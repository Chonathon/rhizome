import {Genre, GenreClusterMode, GenreGraphData, NodeLink} from "@/types";
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useMemo, useState} from "react";
import ForceGraph, {ForceGraphMethods, GraphData, NodeObject} from "react-force-graph-2d";
import {Loading} from "./Loading";
import * as d3 from 'd3-force';
import { useTheme } from "next-themes";
import { CLUSTER_COLORS } from "@/constants";
import { drawCircleNode, drawLabelBelow, labelAlphaForZoom, collideRadiusForNode, LABEL_FONT_SIZE, applyMobileDrawerYOffset, LABEL_FONT_MIN_PX, LABEL_FONT_MAX_PX, DEFAULT_LABEL_FADE_START, DEFAULT_LABEL_FADE_END, DEFAULT_DIM_NODE_ALPHA, DEFAULT_DIM_LABEL_ALPHA, DEFAULT_BASE_LINK_ALPHA, DEFAULT_HIGHLIGHT_LINK_ALPHA, DEFAULT_DIM_LINK_ALPHA, DEFAULT_DIM_HOVER_ENABLED, alphaToHex, updateDimFactorAnimation } from "@/lib/graphStyle";

export type GraphHandle = {
    zoomIn: () => void;
    zoomOut: () => void;
    zoomTo: (k: number, ms?: number) => void;
    getZoom: () => number;
}

interface GenresForceGraphProps {
    graphData?: GenreGraphData;
    onNodeClick: (genre: Genre) => void;
    loading: boolean;
    show: boolean;
    dag: boolean;
    clusterModes: GenreClusterMode[];
    colorMap?: Map<string, string>;
    // Selected genre id to highlight and focus
    selectedGenreId?: string;
    width?: number;
    height?: number;
    // Tweaks for label fade behaviour (optional, matches Artist graph ergonomics)
    labelFadeInStart?: number;
    labelFadeInEnd?: number;
    minLabelPx?: number;
    maxLabelPx?: number;
    // Allow tuning forces per mode without diving into the component internals.
    forceOverrides?: {
        base?: Partial<ForcePreset>;
        dag?: Partial<ForcePreset>;
    };
}

// Styling shared via graphStyle utils

const INITIAL_DECAY = 0.75;
const STABLE_DECAY = 0.92;
const ALPHA_DECAY = 0.01;
const COOLDOWN_TIME_MS = 20000;
const DAG_LEVEL_DISTANCE = 200;
const DEFAULT_LINK_CURVATURE = 0.5;
const DAG_LINK_CURVATURE = 0;
const POINTER_PADDING_PX = 24;

type ForcePreset = {
    chargeStrength: number;
    linkDistance: number;
    linkStrength: number;
    centerStrength: number;
    collideStrength: number;
    collideIterations: number;
    initialZoom: number;
};

const FORCE_PRESETS: Record<'base' | 'dag', ForcePreset> = {
    base: {
        chargeStrength: -130,
        linkDistance: 200,
        linkStrength: 1,
        centerStrength: .05,
        collideStrength: 0.4,
        collideIterations: 1,
        initialZoom: 0.18,
    },
    dag: {
        chargeStrength: -1230,
        linkDistance: 150,
        linkStrength: 1,
        centerStrength: 0.01,
        collideStrength: 0.4,
        collideIterations: 1,
        initialZoom: 0.25,
    },
};

const RADIUS_BASE = 5;
const RADIUS_SQRT_MULTIPLIER = 0.5;
const radiusForCount = (artistCount: number) => RADIUS_BASE + Math.sqrt(artistCount) * RADIUS_SQRT_MULTIPLIER;

const GenresForceGraph = forwardRef<GraphHandle, GenresForceGraphProps>(({
    graphData,
    onNodeClick,
    loading,
    show,
    dag,
    clusterModes,
    colorMap: externalColorMap,
    selectedGenreId,
    width,
    height,
    labelFadeInStart = DEFAULT_LABEL_FADE_START,
    labelFadeInEnd = DEFAULT_LABEL_FADE_END,
    minLabelPx = LABEL_FONT_MIN_PX,
    maxLabelPx = LABEL_FONT_MAX_PX,
    forceOverrides,
}, ref) => {
    const fgRef = useRef<ForceGraphMethods<Genre, NodeLink> | undefined>(undefined);
    const zoomRef = useRef<number>(1);
    const [velocityDecay, setVelocityDecay] = useState<number>(INITIAL_DECAY);
    const hasStabilizedRef = useRef<boolean>(false);
    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
    const prevHoveredRef = useRef<string | undefined>(undefined);
    const yOffsetByIdRef = useRef<Map<string, number>>(new Map());
    const animRafRef = useRef<number | null>(null);
    const dimFactorRef = useRef<Map<string, number>>(new Map());
    const dimAnimRafRef = useRef<number | null>(null);
    const { theme } = useTheme();

    const baseForce = useMemo<ForcePreset>(() => ({
        ...FORCE_PRESETS.base,
        ...(forceOverrides?.base ?? {}),
    }), [forceOverrides?.base]);

    const dagForce = useMemo<ForcePreset>(() => ({
        ...FORCE_PRESETS.dag,
        ...(forceOverrides?.dag ?? {}),
    }), [forceOverrides?.dag]);

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

    const preparedData: GraphData<Genre, NodeLink> = useMemo(() => {
        if (!graphData) return { nodes: [], links: [] };

        // Clone nodes shallowly so FG's runtime props don't leak back upstream.
        const nodes = graphData.nodes.map(n => ({ ...n }));
        // Clone links and normalize source/target to ids if FG already mutated them.
        const links = graphData.links.map((l) => {
            const src: any = (l as any).source;
            const tgt: any = (l as any).target;
            return {
                source: typeof src === 'string' ? src : src?.id,
                target: typeof tgt === 'string' ? tgt : tgt?.id,
                linkType: l.linkType,
            } as NodeLink;
        });

        return { nodes, links };
    }, [graphData]);

    // Animate label y-offset on hover
    useEffect(() => {
        const prev = prevHoveredRef.current;
        const next = hoveredId;
        prevHoveredRef.current = hoveredId;

        const targets = new Map<string, number>();
        if (typeof prev === 'string' && prev !== next) targets.set(prev, 0);
        if (typeof next === 'string') targets.set(next, 4);
        if (targets.size === 0) return;

        const ease = (c: number, t: number) => c + (t - c) * 0.2;
        const step = () => {
            let moving = false;
            const map = yOffsetByIdRef.current;
            targets.forEach((t, id) => {
                const cur = map.get(id) || 0;
                const nxt = ease(cur, t);
                map.set(id, nxt);
                if (Math.abs(nxt - t) > 0.1) moving = true;
            });
            fgRef.current?.refresh?.();
            if (moving) animRafRef.current = requestAnimationFrame(step);
            else {
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

    // Compute a color per top-level parent and propagate to descendants, unless provided
    const nodeColorById = useMemo(() => {
        if (externalColorMap) return externalColorMap;
        const map = new Map<string, string>();
        if (!preparedData.nodes.length) return map;

        // Build parents map: childId -> Set(parentIds)
        const parents = new Map<string, Set<string>>();
        preparedData.links.forEach(l => {
            const src = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
            const tgt = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
            if (!src || !tgt) return;
            if (!parents.has(tgt)) parents.set(tgt, new Set());
            parents.get(tgt)!.add(src);
            if (!parents.has(src)) parents.set(src, parents.get(src) || new Set());
        });

        // Identify root/top-level nodes (no incoming links)
        const nodeIds = preparedData.nodes.map(n => n.id);
        const indegree = new Map<string, number>(nodeIds.map(id => [id, 0]));
        preparedData.links.forEach(l => {
            const tgt = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
            if (tgt) indegree.set(tgt, (indegree.get(tgt) || 0) + 1);
        });
        const roots = nodeIds.filter(id => (indegree.get(id) || 0) === 0);

        // Assign stable colors to roots (sorted by name for determinism)
        const nodeById = new Map(preparedData.nodes.map(n => [n.id, n] as const));
        const sortedRoots = roots
            .map(id => nodeById.get(id)!)
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
        sortedRoots.forEach((n, i) => {
            map.set(n.id, CLUSTER_COLORS[i % CLUSTER_COLORS.length]);
        });

        // For others, walk up to nearest root to inherit color
        const getRootColor = (id: string, hopGuard = 0): string | undefined => {
            if (map.has(id)) return map.get(id);
            //if (hopGuard > 1000) return undefined; // safety
            const p = parents.get(id);
            if (!p || p.size === 0) return undefined;
            // deterministically choose the lexicographically smallest parent
            const parentId = Array.from(p).sort()[0];
            const color = getRootColor(parentId, hopGuard + 1);
            if (color) map.set(id, color);
            return color;
        };
        nodeIds.forEach(id => {
            if (!map.has(id)) {
                const c = getRootColor(id);
                if (!c) map.set(id, theme === 'dark' ? '#8a80ff' : '#4a4a4a');
            }
        });

        return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalColorMap, preparedData.nodes, preparedData.links, theme]);

    useEffect(() => {
        if (!graphData || !fgRef.current) return;

        setVelocityDecay(prev => (prev === INITIAL_DECAY ? prev : INITIAL_DECAY));
        hasStabilizedRef.current = false;

        const { chargeStrength, linkDistance, linkStrength, centerStrength, collideStrength, collideIterations, initialZoom } = dag ? dagForce : baseForce;

        fgRef.current.d3Force('charge')?.strength(chargeStrength);
        const linkForce: any = fgRef.current.d3Force('link');
        linkForce?.distance(linkDistance);
        linkForce?.strength(linkStrength);
        fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(centerStrength));

        fgRef.current.d3Force('collide', d3.forceCollide((node: any) => {
            const genreNode = node as Genre;
            const radius = radiusForCount(genreNode.artistCount);
            return collideRadiusForNode(genreNode.name, radius);
        }).iterations(collideIterations));
        fgRef.current.d3Force('collide')?.strength(collideStrength);

        fgRef.current.d3ReheatSimulation?.();
        fgRef.current.d3VelocityDecay?.(INITIAL_DECAY);
        fgRef.current.zoom(initialZoom);
    }, [graphData, show, dag, baseForce, dagForce]);

    // Build adjacency for 1st-degree neighbors
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
        if (selectedGenreId) return [selectedGenreId];
        if (DEFAULT_DIM_HOVER_ENABLED && hoveredId) return [hoveredId];
        return [];
    }, [selectedGenreId, hoveredId]);

    const activeSourceSet = useMemo(() => new Set(activeSourceIds), [activeSourceIds]);

    const activeNeighborIds = useMemo(() => {
        const set = new Set<string>();
        activeSourceIds.forEach(id => {
            neighborsById.get(id)?.forEach(neighbor => set.add(neighbor));
        });
        return set;
    }, [activeSourceIds, neighborsById]);

    useEffect(() => {
        const enableDimming = Boolean(selectedGenreId) || DEFAULT_DIM_HOVER_ENABLED;
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
    }, [preparedData.nodes, activeSourceIds, activeNeighborIds, selectedGenreId]);

    // Focus viewport on selected genre
    useEffect(() => {
        if (!show || !selectedGenreId || !fgRef.current) return;
        const node = preparedData.nodes.find(n => n.id === selectedGenreId) as (Genre & {x?: number; y?: number}) | undefined;
        if (!node) return;
        const centerToNode = () => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const isMobile = window.matchMedia('(max-width: 640px)').matches;
            const k = zoomRef.current || 1;
            const yAdjusted = applyMobileDrawerYOffset(y, k, isMobile);
            fgRef.current!.centerAt(x, yAdjusted, 600);
            const targetK = Math.max(0.7, Math.min(2.0, (zoomRef.current || 1) < 1 ? 1.15 : zoomRef.current));
            fgRef.current!.zoom(targetK, 600);
        };
        centerToNode();
        const t = setTimeout(centerToNode, 300);
        return () => clearTimeout(t);
    }, [selectedGenreId, show, preparedData]);

    const nodeCanvasObject = (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const genreNode = node as Genre;
        const radius = radiusForCount(genreNode.artistCount);
        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        // Node styling per parent color
        const accent = nodeColorById.get(genreNode.id) || (theme === 'dark' ? '#8a80ff' : '#4a4a4a');
        const isSelected = !!selectedGenreId && genreNode.id === selectedGenreId;
        const isActiveSource = activeSourceSet.has(genreNode.id);
        const isActiveNeighbor = activeNeighborIds.has(genreNode.id);
        const hasHighlight = activeSourceIds.length > 0;
        const dimFactor = dimFactorRef.current.get(genreNode.id) ?? 0;
        const fillAlpha = DEFAULT_DIM_NODE_ALPHA + (1 - DEFAULT_DIM_NODE_ALPHA) * (1 - dimFactor);
        const color = accent + alphaToHex(fillAlpha);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;

        // Draw node
        drawCircleNode(ctx, nodeX, nodeY, isSelected ? radius * 1.35 : radius, color);

        if (isSelected) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, radius * 1.35 + 4, 0, 2 * Math.PI);
            ctx.strokeStyle = accent; // ring matches node color
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }


        // Text styling with zoom-based fade (shared helper)
        const k = zoomRef.current || 1;
        let alpha = labelAlphaForZoom(k, labelFadeInStart, labelFadeInEnd);
        if (isActiveSource) alpha = 1;
        else if (isActiveNeighbor) alpha = Math.max(alpha, 0.85);
        else if (hasHighlight) {
            const dimmedAlpha = DEFAULT_DIM_LABEL_ALPHA + (1 - DEFAULT_DIM_LABEL_ALPHA) * (1 - dimFactor);
            alpha = Math.min(alpha, dimmedAlpha);
        }
        const yOffset = yOffsetByIdRef.current.get(genreNode.id) || 0;
        drawLabelBelow(ctx, genreNode.name, nodeX, nodeY, isSelected ? radius * 1.35 : radius, theme, alpha, {
            fontPx: LABEL_FONT_SIZE,
            yOffsetPx: yOffset,
            globalScale,
            minFontPx: minLabelPx,
            maxFontPx: maxLabelPx,
            scaleWithZoom: true,
        });
    };

    const nodePointerAreaPaint = (node: NodeObject, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
        ctx.fillStyle = color;
        const genreNode = node as Genre;
        const radius = radiusForCount(genreNode.artistCount);
        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius + POINTER_PADDING_PX / (globalScale || 1), 0, 2 * Math.PI, false);
        ctx.fill();
    };

    return !show ? null : loading ? <Loading /> : (
        <ForceGraph
            ref={fgRef}
            d3AlphaDecay={ALPHA_DECAY}
            d3VelocityDecay={velocityDecay}
            cooldownTime={COOLDOWN_TIME_MS}
            autoPauseRedraw={false}
            width={width}
            height={height}
            graphData={preparedData}
            dagMode={dag ? 'radialin' : undefined}
            dagLevelDistance={DAG_LEVEL_DISTANCE}
            linkCurvature={dag ? DAG_LINK_CURVATURE : DEFAULT_LINK_CURVATURE}
            linkColor={(l: any) => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source?.id;
                const targetId = typeof l.target === 'string' ? l.target : l.target?.id;
                const hasHighlight = activeSourceSet.size > 0;
                const base = (sourceId && nodeColorById.get(sourceId)) || (theme === 'dark' ? '#ffffff' : '#000000');
                if (!hasHighlight) {
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
            onNodeClick={node => onNodeClick(node)}
            onZoom={({ k }) => { zoomRef.current = k; }}
            onNodeHover={(n: any) => setHoveredId(n ? n.id : undefined)}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodeVal={(node: Genre) => radiusForCount(node.artistCount)}
            nodePointerAreaPaint={nodePointerAreaPaint}
            onEngineStop={() => {
                if (!hasStabilizedRef.current) {
                    hasStabilizedRef.current = true;
                    fgRef.current?.d3VelocityDecay?.(STABLE_DECAY);
                    setVelocityDecay(STABLE_DECAY);
                }
            }}
        />
    )
});

export default GenresForceGraph;
