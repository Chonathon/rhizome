import {Genre, GenreClusterMode, GenreGraphData, NodeLink} from "@/types";
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useMemo, useState} from "react";
import ForceGraph, {ForceGraphMethods, GraphData, NodeObject} from "react-force-graph-2d";
import {Loading} from "./Loading";
import {forceCollide} from 'd3-force';
import * as d3 from 'd3-force';
import { useTheme } from "next-themes";
import { CLUSTER_COLORS } from "@/constants";
import { drawCircleNode, drawLabelBelow, labelAlphaForZoom, collideRadiusForNode, LABEL_FONT_SIZE, applyMobileDrawerYOffset } from "@/lib/graphStyle";

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
}

// Styling shared via graphStyle utils

const INITIAL_DECAY = 0.75;
const STABLE_DECAY = 0.92;

const GenresForceGraph = forwardRef<GraphHandle, GenresForceGraphProps>(({ graphData, onNodeClick, loading, show, dag, clusterModes, colorMap: externalColorMap, selectedGenreId, width, height }, ref) => {
    const fgRef = useRef<ForceGraphMethods<Genre, NodeLink> | undefined>(undefined);
    const zoomRef = useRef<number>(1);
    const [velocityDecay, setVelocityDecay] = useState<number>(INITIAL_DECAY);
    const hasStabilizedRef = useRef<boolean>(false);
    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
    const prevHoveredRef = useRef<string | undefined>(undefined);
    const yOffsetByIdRef = useRef<Map<string, number>>(new Map());
    const animRafRef = useRef<number | null>(null);
    const { theme } = useTheme();

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
        if (graphData) {
            setVelocityDecay(prev => (prev === INITIAL_DECAY ? prev : INITIAL_DECAY));
            hasStabilizedRef.current = false;

            if (!fgRef.current) return;

            // fgRef.current.d3Force('center')?.strength(-1, -1);
            fgRef.current.d3Force('charge')?.strength(dag ? -1230 : -70); // Applies a repelling force between all nodes
            fgRef.current.d3Force('link')?.distance(dag ? 150 : 70); //how far apart linked nodes want to be and how tightly they pull
            fgRef.current.d3Force('link')?.strength(dag ? 1 : 0.8); 
            // fgRef.current.d3Force('x', d3.forceX(0).strength(0.02));
            // fgRef.current.d3Force('y', d3.forceY(0).strength(0.02));
            fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(dag ? 0.01 : .1));
            
            fgRef.current.d3Force('collide', forceCollide((node => {
                const genreNode = node as Genre;
                const radius = calculateRadius(genreNode.artistCount);
                return collideRadiusForNode(genreNode.name, radius);
            })));
            fgRef.current.d3Force('collide')?.strength(dag ? .02: .7); // Increased strength
            fgRef.current.d3ReheatSimulation?.();
            fgRef.current.d3VelocityDecay?.(INITIAL_DECAY);
            fgRef.current.zoom(dag ? 0.25 : 0.18);
            // fgRef.current.centerAt(0, 0, 0);
        }
    }, [graphData, show, clusterModes]);

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

    const calculateRadius = (artistCount: number) => {
        return 5 + Math.sqrt(artistCount) * .5;
    };

    const nodeCanvasObject = (node: NodeObject, ctx: CanvasRenderingContext2D) => {
        const genreNode = node as Genre;
        const radius = calculateRadius(genreNode.artistCount);
        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        // Node styling per parent color
        const accent = nodeColorById.get(genreNode.id) || (theme === 'dark' ? '#8a80ff' : '#4a4a4a');
        const isSelected = !!selectedGenreId && genreNode.id === selectedGenreId;
        const isNeighbor = !!selectedGenreId && neighborsById.get(selectedGenreId)?.has(genreNode.id);
        const hasSelection = !!selectedGenreId;
        const color = accent + (hasSelection && !isSelected && !isNeighbor ? '30' : 'ff');
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
        let alpha = labelAlphaForZoom(k);
        if (isSelected) alpha = 1;
        else if (isNeighbor) alpha = Math.max(alpha, 0.85);
        else if (hasSelection) alpha = Math.min(alpha, 0.2);
        const yOffset = yOffsetByIdRef.current.get(genreNode.id) || 0;
        drawLabelBelow(ctx, genreNode.name, nodeX, nodeY, isSelected ? radius * 1.35 : radius, theme, alpha, LABEL_FONT_SIZE, yOffset);
    };

    const nodePointerAreaPaint = (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = color;
        const genreNode = node as Genre;
        const radius = calculateRadius(genreNode.artistCount);
        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius + 24, 0, 2 * Math.PI, false); // node pointer area
        ctx.fill();
    }

    return !show ? null : loading ? <Loading /> : (
        <ForceGraph
            ref={fgRef}
             d3AlphaDecay={0.01}     // Length forces are active; smaller → slower cooling
             d3VelocityDecay={velocityDecay}    // How springy tugs feel; smaller → more inertia
            cooldownTime={20000} // How long to run the simulation before stopping
            autoPauseRedraw={false}
            width={width}
            height={height}
            graphData={preparedData}
            dagMode={dag ? 'radialin' : undefined}
            dagLevelDistance={200}
            linkCurvature={dag ? 0 : 0.5}
            linkColor={(l: any) => {
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                const connectedToSelected = !!selectedGenreId && (s === selectedGenreId || t === selectedGenreId);
                const base = (s && nodeColorById.get(s)) || (theme === 'dark' ? '#ffffff' : '#000000');
                const alpha = selectedGenreId ? (connectedToSelected ? 'cc' : '30') : '80';
                return base + alpha;
            }}
            linkWidth={(l: any) => {
                if (!selectedGenreId) return 1;
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                return (s === selectedGenreId || t === selectedGenreId) ? 2.5 : 0.6;
            }}
            onNodeClick={node => onNodeClick(node)}
            onZoom={({ k }) => { zoomRef.current = k; }}
            onNodeHover={(n: any) => setHoveredId(n ? n.id : undefined)}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodeVal={(node: Genre) => calculateRadius(node.artistCount)}
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
