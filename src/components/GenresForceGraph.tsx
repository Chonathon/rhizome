import {Genre, NodeLink} from "@/types";
import React, {useEffect, useState, useRef, useMemo, use} from "react";
import ForceGraph, {ForceGraphMethods, GraphData, NodeObject} from "react-force-graph-2d";
import {Loading} from "./Loading";
import {forceCollide} from 'd3-force';
import * as d3 from 'd3-force';
import { useTheme } from "next-themes";


interface GenresForceGraphProps {
    genres: Genre[];
    links: NodeLink[];
    onNodeClick: (genreName: string) => void;
    loading: boolean;
    show: boolean;
}

// Helper to estimate label width based on name length and font size
const estimateLabelWidth = (name: string, fontSize: number) => name.length * (fontSize * 0.6);

const GenresForceGraph: React.FC<GenresForceGraphProps> = ({ genres, links, onNodeClick, loading, show }) => {
    const [graphData, setGraphData] = useState<GraphData<Genre, NodeLink>>({ nodes: [], links: [] });
    const fgRef = useRef<ForceGraphMethods<Genre, NodeLink> | undefined>(undefined);
    const { theme } = useTheme();

    useEffect(() => {
        if (genres) {
            setGraphData({ nodes: genres, links });
            if (fgRef.current) {
                // fgRef.current.d3Force('center')?.strength(-1, -1);
                fgRef.current.d3Force('charge')?.strength(-200); // Applies a repelling force between all nodes
                fgRef.current.d3Force('link')?.distance(30); //how far apart linked nodes want to be and how tightly they pull
                fgRef.current.d3Force('link')?.strength(0.01); // Prevents nodes from overlapping, based on radius and label width
                fgRef.current.d3Force('collide')?.strength(300);
                fgRef.current.d3Force('x', d3.forceX(0).strength(0.02));
                fgRef.current.d3Force('y', d3.forceY(0).strength(0.02));
                const fontSize = 10;
                const labelWidthBuffer = 20;

                fgRef.current.d3Force('collide', forceCollide((node => {
                    const genreNode = node as Genre;
                    const radius = calculateRadius(genreNode.artistCount);
                    const labelWidth = estimateLabelWidth(genreNode.name, fontSize) / 2 + labelWidthBuffer;
                    const padding = 10;
                    return Math.max(radius + padding, labelWidth + padding);
                })));
                fgRef.current.zoom(.12);
                fgRef.current.centerAt(-400, -400, 0);
            }
        }
    }, [genres, links, show]);

    const calculateRadius = (artistCount: number) => {
        return 5 + Math.sqrt(artistCount) * .5;
    };

    const nodeCanvasObject = (node: NodeObject, ctx: CanvasRenderingContext2D) => {
        const genreNode = node as Genre;
        const radius = calculateRadius(genreNode.artistCount);
        const fontSize = 24;
        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        // Node styling
        ctx.fillStyle = '#8a80ff'; // Equivalent solid color
        ctx.strokeStyle = '#8a80ff'; // Same solid color
        ctx.lineWidth = 0.5;

        // Draw node
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();

        // Text styling
        ctx.font = `${fontSize}px Geist`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = theme === "dark" ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        const verticalPadding = 6;
        ctx.fillText(genreNode.name, nodeX, nodeY + radius + fontSize + verticalPadding);
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
             d3AlphaDecay={0.005}     // Length forces are active; smaller → slower cooling
             d3VelocityDecay={0.6}    // How springy tugs feel; smaller → more inertia
  
            graphData={graphData}
            linkCurvature={0.3}
            linkColor={() => theme === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            linkWidth={0.5}
            onNodeClick={node => onNodeClick(node.name)}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodeVal={(node: Genre) => calculateRadius(node.artistCount)}
            nodePointerAreaPaint={nodePointerAreaPaint}
        />
    )
}

export default GenresForceGraph;