import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import ForceGraph, { ForceGraphMethods, GraphData } from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import * as d3 from 'd3-force';
import { GraphConfig, GraphHandle, GraphLink } from '@/types/graph';
import { Loading } from '@/components/Loading';
import {
  drawCircleNode,
  drawLabelBelow,
  labelAlphaForZoom,
  collideRadiusForNode,
  applyMobileDrawerYOffset,
  LABEL_FONT_SIZE,
  DEFAULT_LABEL_FADE_START,
  DEFAULT_LABEL_FADE_END,
} from '@/lib/graphStyle';

interface GraphProps<TNode extends { id: string; name: string }, TLink extends GraphLink> {
  config: GraphConfig<TNode, TLink>;
  loading?: boolean;
  error?: Error | null;
}

/**
 * Unified Graph Component
 *
 * Configuration-based graph visualization supporting:
 * - Multiple layout types (force, dag, star, custom)
 * - Function-based styling (nodes, links, labels)
 * - Rich interactions (click, hover, zoom, pan)
 * - Performance optimizations (link hiding, label fading)
 * - Generic over node and link types
 */
function GraphComponent<TNode extends { id: string; name: string }, TLink extends GraphLink>(
  { config, loading, error }: GraphProps<TNode, TLink>,
  ref: React.Ref<GraphHandle>
) {
  const { resolvedTheme } = useTheme();
  const fgRef = useRef<ForceGraphMethods<TNode, TLink> | undefined>(undefined);
  const zoomRef = useRef<number>(1);
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  const prevHoveredRef = useRef<string | undefined>(undefined);
  const yOffsetByIdRef = useRef<Map<string, number>>(new Map());
  const animRafRef = useRef<number | null>(null);

  const { nodes, links, layout, styling, interactions, controls, state, width, height } = config;

  // Expose zoom/pan API to parent via ref
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
    centerAt: (x: number, y: number, ms = 600) => {
      fgRef.current?.centerAt?.(x, y, ms);
    },
    centerNode: (nodeId: string, ms = 600) => {
      const node = preparedData.nodes.find(n => n.id === nodeId) as (TNode & { x?: number; y?: number }) | undefined;
      if (!node || !fgRef.current) return;

      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      const k = zoomRef.current || 1;
      const yAdjusted = applyMobileDrawerYOffset(y, k, isMobile);
      fgRef.current.centerAt(x, yAdjusted, ms);
    },
  }), [nodes]);

  // Prepare graph data: clone nodes and normalize links
  const preparedData: GraphData<TNode, TLink> = useMemo(() => {
    if (!nodes || !links) return { nodes: [], links: [] };

    // Clone nodes shallowly to prevent ForceGraph mutations from leaking upstream
    const clonedNodes = nodes.map(n => ({ ...n }));

    // Clone links and normalize source/target to ids (FG may have mutated them)
    const clonedLinks = links.map(l => {
      const src: any = (l as any).source;
      const tgt: any = (l as any).target;
      return {
        ...l,
        source: typeof src === 'string' ? src : src?.id,
        target: typeof tgt === 'string' ? tgt : tgt?.id,
      } as TLink;
    });

    return { nodes: clonedNodes, links: clonedLinks };
  }, [nodes, links]);

  // Build adjacency map for neighbor highlighting
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

  // Precompute node colors (cache for performance)
  const colorById = useMemo(() => {
    const m = new Map<string, string>();
    preparedData.nodes.forEach(node => {
      m.set(node.id, styling.nodeColor(node));
    });
    return m;
  }, [preparedData.nodes, styling.nodeColor, resolvedTheme]);

  const getNodeColor = (node: TNode): string => {
    return colorById.get(node.id) || (resolvedTheme === 'dark' ? '#8a80ff' : '#4a4a4a');
  };

  // Animate label y-offset on hover for smooth visual feedback
  useEffect(() => {
    const prev = prevHoveredRef.current;
    const next = hoveredId;
    prevHoveredRef.current = hoveredId;

    const targets = new Map<string, number>();
    if (typeof prev === 'string' && prev !== next) targets.set(prev, 0);
    if (typeof next === 'string') targets.set(next, 4);

    if (targets.size === 0) return;

    const ease = (current: number, target: number) => current + (target - current) * 0.2;
    const step = () => {
      let anyMoving = false;
      const map = yOffsetByIdRef.current;
      targets.forEach((target, id) => {
        const cur = map.get(id) || 0;
        const nxt = ease(cur, target);
        map.set(id, nxt);
        if (Math.abs(nxt - target) > 0.1) anyMoving = true;
      });
      fgRef.current?.refresh?.();
      if (anyMoving) {
        animRafRef.current = requestAnimationFrame(step);
      } else {
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

  // Configure d3-force simulation based on layout config
  useEffect(() => {
    if (!fgRef.current) return;

    const isDag = layout.type === 'dag';
    const isStar = layout.type === 'star';
    const forceConfig = layout.forceConfig || {};

    if (!isStar) {
      // Apply force configuration
      const charge = forceConfig.charge ?? (isDag ? -1230 : -100);
      const linkDistance = forceConfig.linkDistance ?? (isDag ? 150 : 70);
      const centerStrength = forceConfig.centerStrength ?? (isDag ? 0.01 : 0.1);

      fgRef.current.d3Force('charge')?.strength(charge);
      fgRef.current.d3Force('link')?.distance(linkDistance);
      fgRef.current.d3Force('link')?.strength(isDag ? 1 : 0.85);
      fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(centerStrength));

      // Collision detection
      const collisionRadius = forceConfig.collisionRadius ?? 1;
      fgRef.current.d3Force('collide', d3.forceCollide((node: any) => {
        const n = node as TNode;
        const radius = styling.nodeRadius(n);
        const label = styling.nodeLabel?.(n) ?? n.name;
        return collideRadiusForNode(label, radius) * collisionRadius;
      }).iterations(2));
      fgRef.current.d3Force('collide')?.strength(isDag ? 0.02 : 0.7);
    } else {
      // Star layout: disable forces, position nodes manually
      fgRef.current.d3Force('charge', null);
      fgRef.current.d3Force('link', null);
      fgRef.current.d3Force('center', null);
      fgRef.current.d3Force('collide', null);

      // Position nodes in star topology
      const centerNodeId = layout.starConfig?.centerNodeId;
      const radiusSpacing = layout.starConfig?.radiusSpacing ?? 200;

      if (centerNodeId) {
        const centerNode = preparedData.nodes.find(n => n.id === centerNodeId) as any;
        const outerNodes = preparedData.nodes.filter(n => n.id !== centerNodeId);

        if (centerNode) {
          centerNode.x = 0;
          centerNode.y = 0;
          centerNode.fx = 0;
          centerNode.fy = 0;

          outerNodes.forEach((node: any, i) => {
            const angle = (i / outerNodes.length) * 2 * Math.PI;
            node.x = Math.cos(angle) * radiusSpacing;
            node.y = Math.sin(angle) * radiusSpacing;
            node.fx = node.x;
            node.fy = node.y;
          });
        }
      }
    }

    // Reheat simulation on data/layout changes
    fgRef.current.d3ReheatSimulation?.();

    // Set initial zoom based on layout
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const initialZoom = isDag ? 0.25 : (isMobile ? 0.12 : 0.18);
    fgRef.current.zoom(initialZoom);
  }, [preparedData, layout, styling]);

  // Center and zoom to selected node
  useEffect(() => {
    const selectedNodeId = state?.selectedNodeId;
    if (!selectedNodeId || !fgRef.current) return;

    const node = preparedData.nodes.find(n => n.id === selectedNodeId) as (TNode & { x?: number; y?: number }) | undefined;
    if (!node) return;

    const centerToNode = () => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      const k = zoomRef.current || 1;
      const yAdjusted = applyMobileDrawerYOffset(y, k, isMobile);
      fgRef.current!.centerAt(x, yAdjusted, 600);

      const targetK = Math.max(0.8, Math.min(2.2, (zoomRef.current || 1) < 1 ? 1.2 : zoomRef.current));
      fgRef.current!.zoom(targetK, 600);
    };

    centerToNode();
    const t = setTimeout(centerToNode, 300);
    return () => clearTimeout(t);
  }, [state?.selectedNodeId, preparedData]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex-1 w-full" style={{ height: height ?? '100%' }}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full flex items-center justify-center" style={{ height: height ?? '100%' }}>
        <p className="text-destructive">Error loading graph: {error.message}</p>
      </div>
    );
  }

  // Determine DAG mode
  const dagMode = layout.type === 'dag' ? (layout.dagConfig?.direction === 'LR' || layout.dagConfig?.direction === 'RL' ? 'lr' : 'radialin') : undefined;

  // Link curvature based on layout and performance settings
  const linkCurvature = (() => {
    if (layout.type === 'dag') return 0;
    if (!styling.linkCurvature) return 0;
    const threshold = styling.curvedLinksAbove ?? Infinity;
    return preparedData.links.length <= threshold ? (styling.linkCurvature(preparedData.links[0]) ?? 0.2) : 0;
  })();

  // Link visibility based on zoom and count
  const shouldShowLinks = (() => {
    const maxLinks = styling.maxLinksToShow ?? Infinity;
    if (preparedData.links.length > maxLinks) {
      const threshold = (interactions.hideLinksBelowZoom ?? 0.35) * 1.25;
      return zoomRef.current >= threshold;
    }
    return true;
  })();

  return (
    <ForceGraph
      ref={fgRef as any}
      graphData={preparedData}
      width={width}
      height={height}
      // DAG configuration
      dagMode={dagMode}
      dagLevelDistance={layout.dagConfig?.levelSpacing ?? 200}
      // Link styling
      linkVisibility={() => shouldShowLinks}
      linkColor={(link: any) => {
        if (!styling.linkColor) {
          // Default: use source node color
          const s = typeof link.source === 'string' ? link.source : link.source?.id;
          const selectedNodeId = state?.selectedNodeId;
          const t = typeof link.target === 'string' ? link.target : link.target?.id;
          const connectedToSelected = !!selectedNodeId && (s === selectedNodeId || t === selectedNodeId);
          const base = (s && colorById.get(s)) || (resolvedTheme === 'dark' ? '#ffffff' : '#000000');
          const alpha = selectedNodeId ? (connectedToSelected ? 'ff' : '30') : '80';
          return base + alpha;
        }
        return styling.linkColor(link as TLink);
      }}
      linkWidth={(link: any) => {
        if (!styling.linkWidth) {
          // Default: highlight selected
          const selectedNodeId = state?.selectedNodeId;
          if (!selectedNodeId) return 1;
          const s = typeof link.source === 'string' ? link.source : link.source?.id;
          const t = typeof link.target === 'string' ? link.target : link.target?.id;
          return (s === selectedNodeId || t === selectedNodeId) ? 2.5 : 0.6;
        }
        return styling.linkWidth(link as TLink);
      }}
      linkCurvature={linkCurvature}
      // Node styling (invisible, we'll draw custom)
      nodeColor={() => 'rgba(0,0,0,0)'}
      nodeCanvasObjectMode={() => 'replace'}
      // Interactions
      onNodeClick={(node: any) => interactions.onNodeClick?.(node as TNode)}
      onNodeHover={(node: any) => {
        setHoveredId(node ? node.id : undefined);
        interactions.onNodeHover?.(node as TNode | null);
      }}
      onBackgroundClick={() => interactions.onCanvasClick?.()}
      enableZoomInteraction={interactions.enableZoom ?? true}
      enablePanInteraction={interactions.enablePan ?? true}
      enableNodeDrag={interactions.enableDrag ?? true}
      // Simulation parameters
      d3AlphaDecay={0.01}
      d3VelocityDecay={0.75}
      cooldownTime={20000}
      autoPauseRedraw={false}
      onZoom={({ k }) => { zoomRef.current = k; }}
      // Node sizing (affects repulsion)
      nodeVal={(node: TNode) => styling.nodeRadius(node)}
      // Custom node rendering
      nodeCanvasObject={(node, ctx, globalScale) => {
        const n = node as TNode;
        const x = (node as any).x || 0;
        const y = (node as any).y || 0;

        // Calculate node properties
        const baseRadius = styling.nodeRadius(n);
        const color = getNodeColor(n);
        const label = styling.nodeLabel?.(n) ?? n.name;

        // Selection and neighbor highlighting
        const selectedNodeId = state?.selectedNodeId;
        const isSelected = !!selectedNodeId && n.id === selectedNodeId;
        const isNeighbor = !!selectedNodeId && (styling.highlightNeighbors ?? true) && neighborsById.get(selectedNodeId)?.has(n.id);
        const hasSelection = !!selectedNodeId;

        // Adjust radius for selection
        const radius = isSelected ? baseRadius * 1.4 : baseRadius;

        // Dim non-neighbors when selection exists
        const dimmed = hasSelection && !isSelected && !isNeighbor;
        const nodeColor = color + (dimmed ? '30' : 'ff');

        // Draw node circle
        drawCircleNode(ctx, x, y, radius, nodeColor);

        // Draw selection ring
        if (isSelected) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        // Draw node image if provided
        const imageUrl = styling.nodeImage?.(n);
        if (imageUrl) {
          // TODO: Implement image drawing with caching
          // For now, skip image rendering
        }

        // Draw label with zoom-based fading
        const k = zoomRef.current || 1;
        const fadeStart = interactions.labelFadeInStart ?? DEFAULT_LABEL_FADE_START;
        const fadeEnd = interactions.labelFadeInEnd ?? DEFAULT_LABEL_FADE_END;
        let alpha = labelAlphaForZoom(k, fadeStart, fadeEnd);

        // Override alpha for selected/neighbor
        if (isSelected) alpha = 1;
        else if (isNeighbor) alpha = Math.max(alpha, 0.85);
        else if (hasSelection) alpha = Math.min(alpha, 0.2);

        const yOffset = yOffsetByIdRef.current.get(n.id) || 0;
        drawLabelBelow(ctx, label, x, y, radius, resolvedTheme, alpha, LABEL_FONT_SIZE, yOffset);
      }}
      // Custom pointer area for better click detection
      nodePointerAreaPaint={(node, color, ctx, globalScale) => {
        ctx.fillStyle = color;
        const n = node as TNode;
        const radius = styling.nodeRadius(n) + 24 / (globalScale || 1);
        const x = (node as any).x || 0;
        const y = (node as any).y || 0;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
      }}
    />
  );
}

// Export with forwardRef to preserve generic types
export const Graph = forwardRef(GraphComponent) as <TNode extends { id: string; name: string }, TLink extends GraphLink>(
  props: GraphProps<TNode, TLink> & { ref?: React.Ref<GraphHandle> }
) => ReturnType<typeof GraphComponent>;
