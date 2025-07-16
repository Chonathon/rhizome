import {Genre, GenreClusterMode, GenreGraphData, NodeLink} from "@/types";
import React, {useEffect, useState, useRef, useMemo, use} from "react";
import ForceGraph, {ForceGraphMethods, GraphData, NodeObject} from "react-force-graph-2d";
import {Loading} from "./Loading";
import {forceCollide} from 'd3-force';
import * as d3 from 'd3-force';
import { useTheme } from "next-themes";


interface GenresForceGraphProps {
    genresGraphData?: GenreGraphData;
    onNodeClick: (genre: Genre) => void;
    loading: boolean;
    show: boolean;
    dag: boolean;
    clusterMode: GenreClusterMode;
}

// Helper to estimate label width based on name length and font size
const estimateLabelWidth = (name: string, fontSize: number) => name.length * (fontSize * 0.6);

const GenresForceGraph: React.FC<GenresForceGraphProps> = ({ genresGraphData, onNodeClick, loading, show, dag, clusterMode }) => {
    const [graphData, setGraphData] = useState<GraphData<Genre, NodeLink>>({ nodes: [], links: [] });
    const fgRef = useRef<ForceGraphMethods<Genre, NodeLink> | undefined>(undefined);
    const { theme } = useTheme();

    useEffect(() => {
        if (genresGraphData) {
            const filteredLinks = genresGraphData.links.filter(link => {
                const sourceNode = genresGraphData.nodes.find(node => node.id === link.source);
                if (!sourceNode) return false;

                switch (clusterMode) {
                    case 'subgenre':
                        return sourceNode.subgenres.some(subgenre => subgenre.id === link.target) || sourceNode.subgenre_of.some(parent => parent.id === link.target);
                    case 'influence':
                        return sourceNode.influenced_genres.some(influenced => influenced.id === link.target) || sourceNode.influenced_by.some(influencer => influencer.id === link.target);
                    case 'fusion':
                        return sourceNode.fusion_genres.some(fusion => fusion.id === link.target) || sourceNode.fusion_of.some(fused => fused.id === link.target);
                    default:
                        return true;
                }
            });

            setGraphData({ nodes: genresGraphData.nodes, links: filteredLinks });

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
                fgRef.current.zoom(dag ? 0.3 : 0.15);
                // fgRef.current.centerAt(0, 0, 0);
            }
        }
    }, [genresGraphData, show, clusterMode]);

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
        ctx.fillStyle = 'rgb(138, 128, 255)'; 
        ctx.strokeStyle = 'rgb(138, 128, 255)';
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
        ctx.fillStyle = theme === "dark" ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 255, 0.8)';
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
             d3AlphaDecay={0.008}     // Length forces are active; smaller → slower cooling
             d3VelocityDecay={0.8}    // How springy tugs feel; smaller → more inertia
            cooldownTime={8000} // How long to run the simulation before stopping
            graphData={graphData}
            dagMode={dag ? 'radialout' : undefined}
            dagLevelDistance={300}
            linkCurvature={dag ? 0 : 0.3}
            linkColor={() => theme === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            linkWidth={0.5}
            onNodeClick={node => onNodeClick(node)}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodeVal={(node: Genre) => calculateRadius(node.artistCount)}
            nodePointerAreaPaint={nodePointerAreaPaint}
        />
    )
}

export default GenresForceGraph;