import {Artist, BasicNode, Genre, NodeLink} from "@/types";
import React, {useEffect, useMemo, useState} from "react";
import ForceGraph, {GraphData} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";

interface ArtistsForceGraphProps {
    artists: Artist[];
    artistLinks: NodeLink[];
    onNodeClick: (artist: Artist) => void;
    loading: boolean;
    show: boolean;
}

const ArtistsForceGraph: React.FC<ArtistsForceGraphProps> = ({artists, artistLinks, onNodeClick, loading, show}) => {
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

    return !show ? null : loading ? (<div className="flex-1 h-[calc(100vh-104px)] w-full">
        <Loading />
    </div>) : (
        (<ForceGraph
            graphData={preparedData}
            linkVisibility={true}
            linkColor={'#666666'}
            linkCurvature={0.2}
            onNodeClick={onNodeClick}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Geist`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
                ctx.fillText(label, node.x || 0, node.y || 0);

                node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
            }}
            nodePointerAreaPaint={(node, color, ctx, globalScale) => {
                ctx.fillStyle = color;
                const [width = 0, height = 0] = node.__bckgDimensions || [0, 0];
                const minSize = 24/globalScale; // minimum touch size in pixels
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