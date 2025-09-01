import {Artist, NodeLink} from "@/types";
import React, {useEffect, useMemo, useRef} from "react";
import ForceGraph, {GraphData, ForceGraphMethods} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";
import { ensureContrastOnLight } from "@/lib/utils";
import { drawCircleNode, drawLabelBelow, labelAlphaForZoom, collideRadiusForNode, DEFAULT_LABEL_FADE_START, DEFAULT_LABEL_FADE_END } from "@/lib/graphStyle";
import * as d3 from 'd3-force';

interface ArtistsForceGraphProps {
    artists: Artist[];
    artistLinks: NodeLink[];
    onNodeClick: (artist: Artist) => void;
    loading: boolean;
    show: boolean;
    genreColorMap?: Map<string, string>;
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
    genreColorMap,
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

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge')?.strength(-60);
            fgRef.current.d3Force('link')?.distance(65);
            fgRef.current.d3Force('link')?.strength(0.9);
            fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(0.1));

            // Collide force similar to GenresForceGraph to reduce overlaps
            fgRef.current.d3Force('collide', d3.forceCollide((node: any) => {
                const a = node as Artist;
                return collideRadiusForNode(a.name, radiusFor(a));
            }));
            fgRef.current.d3Force('collide')?.strength(0.7);
        }
    }, [preparedData]);

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
            let color: string | undefined;
            if (genreColorMap && a.genres && a.genres.length) {
                for (const g of a.genres) {
                    const key = g.toLowerCase();
                    color = genreColorMap.get(g) || genreColorMap.get(key);
                    if (color) break;
                }
            }
            if (!color) color = theme === 'dark' ? '#8a80ff' : '#4a4a4a';
            if (theme !== 'dark') color = ensureContrastOnLight(color);
            m.set(a.id, color);
        });
        return m;
    }, [preparedData.nodes, genreColorMap, theme]);

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
                const src = typeof l.source === 'string' ? l.source : l.source?.id;
                const c = (src && colorById.get(src)) || (theme === 'dark' ? '#ffffff' : '#000000');
                return c + '80'; // add alpha
            }}
            linkCurvature={preparedData.links.length <= curvedLinksAbove ? curvedLinkCurvature : 0}
            onNodeClick={onNodeClick}
            // We'll custom-draw nodes; keep built-in node invisible to avoid double-draw
            nodeColor={() => 'rgba(0,0,0,0)'}
            nodeCanvasObjectMode={() => 'replace'}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.85}
            cooldownTime={10000}
            autoPauseRedraw={true}
            onZoom={({ k }) => { zoomRef.current = k; }}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const x = node.x || 0;
                const y = node.y || 0;
                const artist = node as Artist;
                const accent = getArtistColor(artist);

                // draw node circle sized by listeners (match GenresForceGraph style)
                const r = radiusFor(artist);
                drawCircleNode(ctx, x, y, r, accent);

                // fade-in label opacity based on zoom level; centralized utility
                const k = zoomRef.current || 1;
                const alpha = labelAlphaForZoom(k, labelFadeInStart, labelFadeInEnd);
                const label = node.name;
                drawLabelBelow(ctx, label, x, y, r, theme, alpha);
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
