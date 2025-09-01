import {Artist, NodeLink} from "@/types";
import React, {useEffect, useMemo, useRef} from "react";
import ForceGraph, {GraphData, ForceGraphMethods} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";
import { ensureContrastOnLight } from "@/lib/utils";
import * as d3 from 'd3-force';

interface ArtistsForceGraphProps {
    artists: Artist[];
    artistLinks: NodeLink[];
    onNodeClick: (artist: Artist) => void;
    loading: boolean;
    show: boolean;
    genreColorMap?: Map<string, string>;
}

const ArtistsForceGraph: React.FC<ArtistsForceGraphProps> = ({artists, artistLinks, onNodeClick, loading, show, genreColorMap}) => {
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

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge')?.strength(-60);
            fgRef.current.d3Force('link')?.distance(65);
            fgRef.current.d3Force('link')?.strength(0.9);
            fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(0.1));
        }
    }, [preparedData]);

    const getArtistColor = (artist: Artist): string => {
        if (!genreColorMap) return theme === 'dark' ? '#8a80ff' : '#4a4a4a';
        if (artist.genres && artist.genres.length) {
            for (const g of artist.genres) {
                const key = g.toLowerCase();
                const color = genreColorMap.get(g) || genreColorMap.get(key);
                if (color) return color;
            }
        }
        return theme === 'dark' ? '#8a80ff' : '#4a4a4a';
    };

    return !show ? null : loading ? (<div className="flex-1 h-[calc(100vh-104px)] w-full">
        <Loading />
    </div>) : (
        (<ForceGraph
            ref={fgRef as any}
            graphData={preparedData}
            linkVisibility={true}
            linkColor={(l: any) => {
                const src = typeof l.source === 'string' ? l.source : l.source?.id;
                const artist = preparedData.nodes.find(n => n.id === src);
                let c = artist ? getArtistColor(artist) : (theme === 'dark' ? '#ffffff' : '#000000');
                if (theme !== 'dark') {
                    // darken for contrast in light mode (links are translucent)
                    c = ensureContrastOnLight(c);
                }
                // add 50% alpha via 80 hex
                return c + '80';
            }}
            linkCurvature={0.2}
            onNodeClick={onNodeClick}
            nodeColor={() => 'rgba(0,0,0,0)'}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const x = node.x || 0;
                const y = node.y || 0;
                const artist = node as Artist;
                let accent = getArtistColor(artist);
                if (theme !== 'dark') accent = ensureContrastOnLight(accent);

                // draw label only (no visible node)
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Geist`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.3);

                // subtle halo for readability
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = Math.max(2, 2 / globalScale);
                ctx.strokeStyle = theme === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)';
                ctx.strokeText(label, x, y);

                // colored text
                ctx.fillStyle = accent;
                ctx.fillText(label, x, y);

                // store bounds for pointer hit area
                (node as any).__bckgDimensions = bckgDimensions;
            }}
            nodePointerAreaPaint={(node, color, ctx, globalScale) => {
                ctx.fillStyle = color;
                const [width = 0, height = 0] = (node as any).__bckgDimensions || [0, 0];
                const minSize = 24 / globalScale; // minimum touch size
                const w = Math.max(width, minSize);
                const h = Math.max(height, minSize);
                const x = (node.x || 0) - w / 2;
                const y = (node.y || 0) - h / 2;
                ctx.fillRect(x, y, w, h);
            }}
        />)
    )
}

export default ArtistsForceGraph;
