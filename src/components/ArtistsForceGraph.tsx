import {Artist, BasicNode, NodeLink} from "@/types";
import React, {useEffect, useState} from "react";
import ForceGraph, {GraphData} from "react-force-graph-2d";
import { Loading } from "./Loading";
import { useTheme } from "next-themes";

// Needs more props like the view/filtering controls
interface ArtistsForceGraphProps {
    artists: Artist[];
    artistLinks: NodeLink[];
    onNodeClick: (artist: Artist) => void;
    loading: boolean;
    show: boolean;
}

const ArtistsForceGraph: React.FC<ArtistsForceGraphProps> = ({artists, artistLinks, onNodeClick, loading, show}) => {
    const [graphData, setGraphData] = useState<GraphData<Artist, NodeLink>>({ nodes: [], links: [] });
    const { theme } = useTheme();

    useEffect(() => {
        if (artists && artistLinks) {
            setGraphData(
                {
                    nodes: artists,
                    links: artistLinks
                }
            );
        }

    }, [artists, artistLinks]);

    return !show ? null : loading ? (<div className="flex-1 h-[calc(100vh-104px)] w-full">
        <Loading />
    </div>) : (
        (<ForceGraph
            graphData={graphData}
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