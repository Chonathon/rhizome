import {Genre, GenreClusterMode, GenreGraphData, NodeLink} from "@/types";
import React, {useEffect, useRef, useMemo} from "react";
import ForceGraph, {ForceGraphMethods, GraphData, NodeObject} from "react-force-graph-2d";
import {Loading} from "./Loading";
import {forceCollide} from 'd3-force';
import * as d3 from 'd3-force';
import { useTheme } from "next-themes";
import { clusterColors } from "@/lib/utils";

interface GenresForceGraphProps {
    graphData?: GenreGraphData;
    onNodeClick: (genre: Genre) => void;
    loading: boolean;
    show: boolean;
    dag: boolean;
    clusterMode: GenreClusterMode;
}

// Helper to estimate label width based on name length and font size
const LABEL_FONT_SIZE = 12;
const estimateLabelWidth = (name: string) => name.length * (LABEL_FONT_SIZE * 0.6);

const GenresForceGraph: React.FC<GenresForceGraphProps> = ({ graphData, onNodeClick, loading, show, dag, clusterMode }) => {
    const fgRef = useRef<ForceGraphMethods<Genre, NodeLink> | undefined>(undefined);
    const { theme } = useTheme();

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

    // Compute a color per top-level parent and propagate to descendants
    const nodeColorById = useMemo(() => {
        const colorMap = new Map<string, string>();
        if (!preparedData.nodes.length) return colorMap;

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
            colorMap.set(n.id, clusterColors[i % clusterColors.length]);
        });

        // For others, walk up to nearest root to inherit color
        const getRootColor = (id: string, hopGuard = 0): string | undefined => {
            if (colorMap.has(id)) return colorMap.get(id);
            if (hopGuard > 1000) return undefined; // safety
            const p = parents.get(id);
            if (!p || p.size === 0) return undefined;
            // deterministically choose the lexicographically smallest parent
            const parentId = Array.from(p).sort()[0];
            const color = getRootColor(parentId, hopGuard + 1);
            if (color) colorMap.set(id, color);
            return color;
        };
        nodeIds.forEach(id => {
            if (!colorMap.has(id)) {
                const c = getRootColor(id);
                if (!c) colorMap.set(id, theme === 'dark' ? '#8a80ff' : '#4a4a4a');
            }
        });

        return colorMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preparedData.nodes, preparedData.links, theme]);

    useEffect(() => {
        if (graphData) {
            if (fgRef.current) {
                // fgRef.current.d3Force('center')?.strength(-1, -1);
                fgRef.current.d3Force('charge')?.strength(dag ? -1230 : -70); // Applies a repelling force between all nodes
                fgRef.current.d3Force('link')?.distance(dag ? 150 : 70); //how far apart linked nodes want to be and how tightly they pull
                fgRef.current.d3Force('link')?.strength(dag ? 1 : 0.8); 
                // fgRef.current.d3Force('x', d3.forceX(0).strength(0.02));
                // fgRef.current.d3Force('y', d3.forceY(0).strength(0.02));
                fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(dag ? 0.01 : .1));
                
                const labelWidthBuffer = 20;
                
                fgRef.current.d3Force('collide', forceCollide((node => {
                    const genreNode = node as Genre;
                    const radius = calculateRadius(genreNode.artistCount);
                    const labelWidth = estimateLabelWidth(genreNode.name);
                    const labelHeight = LABEL_FONT_SIZE;
                    const padding = 8; 
                    return Math.max(radius + padding, Math.sqrt(labelWidth * labelWidth + labelHeight * labelHeight) / 2 + padding);
                })));
                fgRef.current.d3Force('collide')?.strength(dag ? .02: .7); // Increased strength
                fgRef.current.zoom(dag ? 0.25 : 0.18);
                // fgRef.current.centerAt(0, 0, 0);
            }
        }
    }, [graphData, show, clusterMode]);

    const calculateRadius = (artistCount: number) => {
        return 5 + Math.sqrt(artistCount) * .5;
    };

    const nodeCanvasObject = (node: NodeObject, ctx: CanvasRenderingContext2D) => {
        const genreNode = node as Genre;
        const radius = calculateRadius(genreNode.artistCount);
        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        // Node styling per parent color
        const color = nodeColorById.get(genreNode.id) || (theme === 'dark' ? 'rgb(138,128,255)' : 'rgb(74,74,74)');
        ctx.fillStyle = color; 
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;

        // Draw node
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();

        // Text styling
        ctx.font = `${LABEL_FONT_SIZE}px Geist`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = theme === "dark" ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(genreNode.name, nodeX, nodeY + radius + 8);
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
             d3VelocityDecay={.75}    // How springy tugs feel; smaller → more inertia
            cooldownTime={20000} // How long to run the simulation before stopping
            graphData={preparedData}
            dagMode={dag ? 'radialin' : undefined}
            dagLevelDistance={200}
            linkCurvature={dag ? 0 : 0.5}
            linkColor={() => theme === "dark" ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)'}
            linkWidth={1}
            onNodeClick={node => onNodeClick(node)}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodeVal={(node: Genre) => calculateRadius(node.artistCount)}
            nodePointerAreaPaint={nodePointerAreaPaint}
        />
    )
}

export default GenresForceGraph;
