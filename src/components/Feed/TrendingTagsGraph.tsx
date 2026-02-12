import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { useTheme } from "next-themes";
import { FeedItem } from "@/types";
import {
    extractFeedEntities,
    getTopTrending,
    extractCooccurrences,
    ExtractedEntity,
} from "@/lib/feedEntityExtraction";

interface TrendingTagsGraphProps {
    items: FeedItem[];
    maxNodes?: number;
    height?: number;
    onNodeClick?: (entity: ExtractedEntity) => void;
}

interface GraphNode {
    id: string;
    name: string;
    type: ExtractedEntity['type'];
    count: number;
    color: string;
}

interface GraphLink {
    source: string;
    target: string;
    weight: number;
}

// Colors for entity types
const TYPE_COLORS: Record<ExtractedEntity['type'], { light: string; dark: string }> = {
    artist: { light: '#3b82f6', dark: '#60a5fa' },
    genre: { light: '#9333ea', dark: '#c084fc' },
    label: { light: '#d97706', dark: '#fbbf24' },
    city: { light: '#059669', dark: '#34d399' },
};

export function TrendingTagsGraph({
    items,
    maxNodes = 12,
    height = 200,
    onNodeClick,
}: TrendingTagsGraphProps) {
    const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const graphData = useMemo(() => {
        if (items.length === 0) return { nodes: [], links: [] };

        const entities = extractFeedEntities(items);
        const topEntities = getTopTrending(entities, maxNodes);
        const cooccurrences = extractCooccurrences(items, topEntities);

        const nodes: GraphNode[] = topEntities.map(entity => ({
            id: entity.name,
            name: entity.name,
            type: entity.type,
            count: entity.count,
            color: isDark ? TYPE_COLORS[entity.type].dark : TYPE_COLORS[entity.type].light,
        }));

        const nodeIds = new Set(nodes.map(n => n.id));
        const links: GraphLink[] = cooccurrences
            .filter(c => nodeIds.has(c.source) && nodeIds.has(c.target))
            .map(c => ({
                source: c.source,
                target: c.target,
                weight: c.weight,
            }));

        return { nodes, links };
    }, [items, maxNodes, isDark]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        if (onNodeClick) {
            onNodeClick({
                name: node.name,
                type: node.type,
                count: node.count,
            });
        }
    }, [onNodeClick]);

    const nodeCanvasObject = useCallback((
        node: GraphNode,
        ctx: CanvasRenderingContext2D,
        globalScale: number
    ) => {
        const radius = Math.max(4, Math.min(12, 4 + node.count * 2));
        const x = node.x ?? 0;
        const y = node.y ?? 0;

        // Draw node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Draw label
        const label = node.name;
        const fontSize = Math.max(8, 10 / globalScale);
        ctx.font = `${fontSize}px Geist, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDark ? '#e5e5e5' : '#262626';
        ctx.fillText(label, x, y + radius + 2);
    }, [isDark]);

    const linkColor = useCallback(() => {
        return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    }, [isDark]);

    const linkWidth = useCallback((link: GraphLink) => {
        return Math.max(0.5, Math.min(3, link.weight * 0.5));
    }, []);

    if (graphData.nodes.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="rounded-lg overflow-hidden bg-muted/20 border w-full"
            style={{ height }}
        >
            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                width={width}
                height={height}
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={(node, color, ctx) => {
                    const radius = Math.max(4, Math.min(12, 4 + (node.count ?? 1) * 2));
                    ctx.beginPath();
                    ctx.arc(node.x ?? 0, node.y ?? 0, radius + 2, 0, 2 * Math.PI);
                    ctx.fillStyle = color;
                    ctx.fill();
                }}
                linkColor={linkColor}
                linkWidth={linkWidth}
                onNodeClick={handleNodeClick}
                onEngineStop={() => fgRef.current?.zoomToFit(300, 20)}
                cooldownTicks={50}
                d3AlphaDecay={0.05}
                d3VelocityDecay={0.3}
            />
        </div>
    );
}
