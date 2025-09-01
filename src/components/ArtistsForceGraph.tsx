import {Artist, NodeLink} from "@/types";
import React, {useEffect, useMemo, useRef} from "react";
import ForceGraph, {GraphData, ForceGraphMethods} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";
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
    const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());

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
                const c = artist ? getArtistColor(artist) : (theme === 'dark' ? '#ffffff' : '#000000');
                // add 50% alpha via 80 hex
                return c + '80';
            }}
            linkCurvature={0.2}
            onNodeClick={onNodeClick}
            nodeColor={() => 'rgba(0,0,0,0)'}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const x = node.x || 0;
                const y = node.y || 0;
                const radius = 16; // circle radius in px
                const artist = node as Artist;
                const accent = getArtistColor(artist);

                // draw circular image if available
                const imgUrl = (node as any).image as string | undefined;
                let drewImage = false;
                if (imgUrl) {
                    let img = imgCache.current.get(imgUrl);
                    if (!img) {
                        img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => fgRef.current?.d3ReheatSimulation();
                        img.src = imgUrl;
                        imgCache.current.set(imgUrl, img);
                    }
                    if (img.complete && img.naturalWidth > 0) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                        ctx.closePath();
                        ctx.clip();
                        const size = radius * 2;
                        const imgRatio = img.naturalWidth / img.naturalHeight;
                        let drawW = size, drawH = size;
                        if (imgRatio > 1) { // wider
                            drawH = size;
                            drawW = size * imgRatio;
                        } else {
                            drawW = size;
                            drawH = size / imgRatio;
                        }
                        const dx = x - drawW / 2;
                        const dy = y - drawH / 2;
                        ctx.drawImage(img, dx, dy, drawW, drawH);
                        ctx.restore();
                        drewImage = true;
                    }
                }

                if (!drewImage) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = theme === 'dark' ? '#333' : '#ddd';
                    ctx.fill();
                }

                // colored ring/border
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                ctx.strokeStyle = accent;
                ctx.lineWidth = Math.max(2, 2 / globalScale);
                ctx.stroke();

                // label
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Geist`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
                ctx.fillText(label, x, y + radius + 2);
            }}
            nodePointerAreaPaint={(node, color, ctx, globalScale) => {
                const radius = 16;
                const x = node.x || 0;
                const y = node.y || 0;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                ctx.fill();
                }}
        />)
    )
}

export default ArtistsForceGraph;
