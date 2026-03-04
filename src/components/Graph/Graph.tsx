import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import ForceGraph, {
  ForceGraphMethods,
  GraphData,
  NodeObject,
} from "react-force-graph-2d";
import * as d3 from "d3-force";
import { useTheme } from "next-themes";
import { Loading } from "@/components/Loading";
import {
  LABEL_FONT_SIZE,
  DEFAULT_LABEL_FADE_START,
  DEFAULT_LABEL_FADE_END,
  labelAlphaForZoom,
  labelValueThresholdForZoom,
  fontPxForZoom,
  smoothstep,
  applyLabelFadeCurve,
  DEFAULT_PRIORITY_LABEL_IMPORTANCE_THRESHOLD,
  DEFAULT_PRIORITY_LABEL_ZOOM_SCALE,
  DEFAULT_PRIORITY_LABEL_PERCENT,
  drawCircleNode,
  drawSelectedNodeFill,
  drawLabelBelow,
  applyMobileDrawerYOffset,
  DEFAULT_MOBILE_CENTER_OFFSET_PX,
  applyDesktopDrawerXOffset,
  estimateLabelWidth,
  getDefaultGraphZoom,
  onImageLoad,
  onImageLoadStart,
  hasLoadingImages,
} from "@/components/Graph/graphStyle";
import { useSidebar } from "@/components/ui/sidebar";
import type {BasicNode, GraphHandle} from "@/types";

export type { GraphHandle };

export interface SharedGraphNode<T = unknown> {
  id: string;
  label: string;
  radius: number;
  color?: string;
  // Normalized 0-1 value for label density filtering at low zoom
  labelValue?: number;
  data: T;
}

export interface SharedGraphLink {
  source: string;
  target: string;
}

export interface NodeRenderContext<T> {
  ctx: CanvasRenderingContext2D;
  node: SharedGraphNode<T>;
  x: number;
  y: number;
  radius: number;
  color: string;
  isSelected: boolean;
  isClickSelected: boolean;
  isNeighbor: boolean;
  isHovered: boolean;
  alpha: number;
  theme: 'light' | 'dark' | undefined;
}

export interface SelectionRenderContext<T> extends NodeRenderContext<T> {}

export interface LabelRenderContext<T> extends NodeRenderContext<T> {
  label: string;
  labelAlpha: number;
  zoomLevel: number;
}

export type NodeRenderer<T> = (ctx: NodeRenderContext<T>) => void;
export type SelectionRenderer<T> = (ctx: SelectionRenderContext<T>) => void;
export type LabelRenderer<T> = (ctx: LabelRenderContext<T>) => void;

export interface GraphProps<T, L extends SharedGraphLink> {
  nodes: SharedGraphNode<T>[];
  links: L[];
  show?: boolean;
  loading?: boolean;
  width?: number;
  height?: number;
  selectedId?: string;
  hoverSelectedId?: string | null;
  dagMode?: boolean;
  autoFocus?: boolean;
  onNodeClick?: (node: T) => void;
  onNodeHover?: (node: T | undefined, screenPosition: { x: number; y: number } | null) => void;
  onZoomChange?: (zoom: number) => void;
  renderNode?: NodeRenderer<T>;
  renderSelection?: SelectionRenderer<T>;
  renderLabel?: LabelRenderer<T>;
  // Display controls
  nodeSize?: number;
  linkThickness?: number;
  linkCurvature?: number;
  showLabels?: boolean;
  labelSize?: 'Small' | 'Default' | 'Large';
  textFadeThreshold?: number;
  showNodes?: boolean;
  showLinks?: boolean;
  disableDimming?: boolean;
  priorityLabelIds?: string[];
  // Radial layout for popularity stratification (concentric rings)
  radialLayout?: {
    enabled: boolean;
    nodeToRadius: Map<string, number>;
    strength?: number;
  };
}

type PreparedNode<T> = SharedGraphNode<T> & { x?: number; y?: number };

function defaultRenderNode<T>(ctx: NodeRenderContext<T>): void {
  const { ctx: canvas, node, x, y, radius, color, alpha, isClickSelected, theme } = ctx;
  canvas.save();
  canvas.globalAlpha = alpha;

  // For click-selected nodes, draw image (artist) or letter (genre) fill
  if (isClickSelected) {
    const data = node.data as { image?: string; listeners?: number } | undefined;
    const imageUrl = data?.image;
    const isArtist = typeof data?.listeners === 'number';
    drawSelectedNodeFill(canvas, x, y, radius, node.label, color, imageUrl, theme, isArtist);
  } else {
    drawCircleNode(canvas, x, y, radius, color);
  }

  canvas.restore();
}

function defaultRenderSelection<T>(ctx: SelectionRenderContext<T>): void {
  const { ctx: canvas, x, y, radius, theme } = ctx;
  canvas.save();
  canvas.beginPath();
  canvas.arc(x, y, radius + 4, 0, 2 * Math.PI);
  // Use same color as label pill background
  canvas.strokeStyle = theme === 'dark' ? 'oklch(0.922 0 0)' : 'oklch(0.205 0 0)';
  canvas.lineWidth = 4;
  canvas.stroke();
  canvas.restore();
}

function defaultRenderLabel<T>(ctx: LabelRenderContext<T>, fontSize: number = LABEL_FONT_SIZE, customColor?: string, bold = false, showBackground = false): void {
  const { ctx: canvas, label, x, y, radius, theme, labelAlpha } = ctx;
  drawLabelBelow(canvas, label, x, y, radius, theme, labelAlpha, fontSize, 0, customColor, bold, showBackground);
}

const Graph = forwardRef(function GraphInner<
  T,
  L extends SharedGraphLink,
>(
  {
    nodes,
    links,
    show = true,
    loading = false,
    width,
    height,
    selectedId,
    hoverSelectedId,
    dagMode = false,
    autoFocus = true,
    onNodeClick,
    onNodeHover,
    onZoomChange,
    renderNode = defaultRenderNode,
    renderSelection = defaultRenderSelection,
    renderLabel = defaultRenderLabel,
    nodeSize = 50,
    linkThickness = 50,
    linkCurvature = 50,
    showLabels = true,
    labelSize = 'Default',
    textFadeThreshold = 50,
    showNodes = true,
    showLinks = true,
    disableDimming = false,
    priorityLabelIds: priorityLabelIdsProp,
    radialLayout,
  }: GraphProps<T, L>,
  ref: Ref<GraphHandle>,
) {
  const fgRef = useRef<ForceGraphMethods<PreparedNode<T>, L> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<number>(1);
  const showNodesRef = useRef<boolean>(showNodes);
  const showLinksRef = useRef<boolean>(showLinks);
  const { resolvedTheme } = useTheme();
  const { state: sidebarState } = useSidebar();
  const sidebarExpanded = sidebarState === "expanded";
  const resetCenterTimeoutRef = useRef<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  const lastInitializedSignatureRef = useRef<string | undefined>(undefined);
  const shouldResetZoomRef = useRef(true);
  const preparedDataRef = useRef<GraphData<PreparedNode<T>, L> | null>(null);
  const onZoomChangeRef = useRef<((zoom: number) => void) | undefined>(onZoomChange);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    return () => {
      if (resetCenterTimeoutRef.current) {
        window.clearTimeout(resetCenterTimeoutRef.current);
      }
    };
  }, []);

  // Update refs when showNodes/showLinks change
  useEffect(() => {
    showNodesRef.current = showNodes;
    showLinksRef.current = showLinks;
  }, [showNodes, showLinks]);

  // Convert display control values to usable ranges (all centered at 50 = 1.0x)
  const nodeScaleFactor = useMemo(() => {
    return nodeSize <= 50
      ? 0.5 + (nodeSize / 50) * 0.5  // 0-50 → 0.5-1.0
      : 1.0 + ((nodeSize - 50) / 50) * 1.0; // 50-100 → 1.0-2.0
  }, [nodeSize]);

  const linkThicknessScale = useMemo(() => {
    return linkThickness <= 50
      ? 0.5 + (linkThickness / 50) * 0.5  // 0-50 → 0.5-1.0
      : 1.0 + ((linkThickness - 50) / 50) * 1.0; // 50-100 → 1.0-2.0
  }, [linkThickness]);

  const linkCurvatureValue = useMemo(() => {
    return linkCurvature / 100; // 0-100 → 0.0-1.0
  }, [linkCurvature]);

  const labelFontSize = useMemo(() => {
    return labelSize === 'Small' ? 10 : labelSize === 'Large' ? 16 : 12;
  }, [labelSize]);

  const { labelFadeStart, labelFadeEnd } = useMemo(() => {
    // Map textFadeThreshold (0-100, center at 50) to fade scale factor
    // Higher threshold = lower zoom values needed = can zoom out more and see text
    // Invert the threshold so higher values give lower fade thresholds
    const inverted = 100 - textFadeThreshold;
    const fadeScale = inverted <= 50
      ? 0.5 + (inverted / 50) * 0.5  // 0-50 → 0.5x-1.0x
      : 1.0 + ((inverted - 50) / 50) * 2.0; // 50-100 → 1.0x-3.0x
    return {
      labelFadeStart: DEFAULT_LABEL_FADE_START * fadeScale,
      labelFadeEnd: DEFAULT_LABEL_FADE_END * fadeScale,
    };
  }, [textFadeThreshold]);

  // Dimming transition state (0 = fully dimmed/normal, 1 = fully undimmed)
  const dimmingTransitionRef = useRef<number>(disableDimming ? 1 : 0);
  const targetDimmingRef = useRef<number>(disableDimming ? 1 : 0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const cur = zoomRef.current || 1;
        const target = Math.min(20, cur * 2);
        fgRef.current?.zoom?.(target, 400);
        zoomRef.current = target;
        onZoomChangeRef.current?.(target);
      },
      zoomOut: () => {
        const cur = zoomRef.current || 1;
        const target = Math.max(0.03, cur / 2);
        fgRef.current?.zoom?.(target, 400);
        zoomRef.current = target;
        onZoomChangeRef.current?.(target);
      },
      zoomTo: (k: number, ms = 400) => {
        const target = Math.max(0.03, Math.min(20, k));
        fgRef.current?.zoom?.(target, ms);
        zoomRef.current = target;
        onZoomChangeRef.current?.(target);
      },
      resetView: (k: number, ms = 400) => {
        const target = Math.max(0.03, Math.min(20, k));
        fgRef.current?.centerAt?.(0, 0, ms);
        fgRef.current?.zoom?.(target, ms);
        zoomRef.current = target;
        onZoomChangeRef.current?.(target);
        if (resetCenterTimeoutRef.current) {
          window.clearTimeout(resetCenterTimeoutRef.current);
        }
      },
      getZoom: () => zoomRef.current || 1,
      getCanvas: () => {
        // Access the canvas element from the container div
        if (containerRef.current) {
          const canvas = containerRef.current.querySelector('canvas');
          return canvas as HTMLCanvasElement | null;
        }
        return null;
      },
    }),
    [],
  );

  const preparedData: GraphData<PreparedNode<T>, L> = useMemo(() => {
    const clonedNodes = nodes.map((node) => ({ ...node }));
    const clonedLinks = links.map((link) => ({ ...link }));
    return { nodes: clonedNodes, links: clonedLinks };
  }, [nodes, links]);

  const priorityLabelIds = useMemo(() => {
    if (priorityLabelIdsProp !== undefined) {
      return new Set(priorityLabelIdsProp);
    }
    const values = preparedData.nodes
      .map((node) => ({ id: node.id, value: node.labelValue }))
      .filter((entry): entry is { id: string; value: number } =>
        typeof entry.value === "number" && Number.isFinite(entry.value)
      );
    if (!values.length) return new Set<string>();
    const count = Math.max(1, Math.ceil(values.length * DEFAULT_PRIORITY_LABEL_PERCENT));
    const sorted = [...values].sort((a, b) => b.value - a.value);
    const cutoff = sorted[Math.min(count - 1, sorted.length - 1)].value;
    return new Set(values.filter((entry) => entry.value >= cutoff).map((entry) => entry.id));
  }, [priorityLabelIdsProp, preparedData.nodes]);

  // Stable fingerprint lets us detect meaningful topology changes without diffing objects deeply.
  const dataSignature = useMemo(() => {
    if (!preparedData.nodes.length && !preparedData.links.length) return "empty";
    const normalize = (value: unknown) => {
      if (typeof value === "string" || typeof value === "number") return String(value);
      if (value && typeof value === "object" && "id" in value) {
        return String((value as NodeObject)?.id ?? "");
      }
      return "";
    };
    const nodeSignature = [...preparedData.nodes.map((node) => node.id)].sort().join("|");
    const linkSignature = preparedData.links
      .map((link) => `${normalize(link.source)}->${normalize(link.target)}`)
      .sort()
      .join("|");
    return `${nodeSignature}::${linkSignature}`;
  }, [preparedData.links, preparedData.nodes]);

  const colorById = useMemo(() => {
    const defaultColor = resolvedTheme === "dark" ? "#8a80ff" : "#4a4a4a";
    return new Map(preparedData.nodes.map((node) => [node.id, node.color ?? defaultColor]));
  }, [preparedData.nodes, resolvedTheme]);

  const neighborsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    preparedData.nodes.forEach((n) => map.set(n.id, new Set()));
    preparedData.links.forEach((link) => {
      const source = typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
      const target = typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
      const sourceStr = String(source);
      const targetStr = String(target);
      if (!source || !target) return;
      if (!map.has(sourceStr)) map.set(sourceStr, new Set());
      if (!map.has(targetStr)) map.set(targetStr, new Set());
      map.get(sourceStr)!.add(targetStr);
      map.get(targetStr)!.add(sourceStr);
    });
    return map;
  }, [preparedData]);

  // Pre-calculate values that are constant across all nodes during a render
  const defaultColor = resolvedTheme === "dark" ? "#8a80ff" : "#4a4a4a";
  const effectiveSelectedId = hoverSelectedId || selectedId;
  const hasSelection = !!effectiveSelectedId;
  const selectedNeighbors = hasSelection && effectiveSelectedId ? neighborsById.get(effectiveSelectedId) : undefined;

  useEffect(() => {
    if (preparedDataRef.current !== preparedData) {
      // Snapshot new data so rerenders caused by props toggling do not retrigger reheats.
      preparedDataRef.current = preparedData;
      lastInitializedSignatureRef.current = undefined;
      shouldResetZoomRef.current = true;
    }
  }, [preparedData]);

  // Smooth transition for dimming state changes
  useEffect(() => {
    const target = disableDimming ? 1 : 0;
    targetDimmingRef.current = target;

    // Start animation loop if not already running
    if (animationFrameRef.current === null) {
      lastFrameTimeRef.current = performance.now();

      // Resume graph rendering during transition (doesn't affect physics)
      fgRef.current?.resumeAnimation?.();

      const animate = () => {
        const now = performance.now();
        const deltaTime = (now - lastFrameTimeRef.current) / 1000; // Convert to seconds
        lastFrameTimeRef.current = now;

        const current = dimmingTransitionRef.current;
        const target = targetDimmingRef.current;
        const diff = target - current;

        // Stop if converged (within 0.01)
        if (Math.abs(diff) < 0.01) {
          dimmingTransitionRef.current = target;
          animationFrameRef.current = null;
          // Graph will auto-pause due to autoPauseRedraw
          return;
        }

        // Linear interpolation with speed factor (transition over ~300ms)
        const speed = 3.5; // Higher = faster transition
        const step = diff * speed * deltaTime;
        dimmingTransitionRef.current = current + step;

        // Continue animation (graph render loop handles the actual redraw)
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [disableDimming]);

  useEffect(() => {
    // Pause instead of unmounting so the physics state survives hidden periods.
    if (!fgRef.current) return;
    if (show) fgRef.current.resumeAnimation();
    else fgRef.current.pauseAnimation();
  }, [show]);

  // Trigger redraw when images load and animate pulse during loading
  useEffect(() => {
    let animationFrame: number | null = null;

    const animate = () => {
      if (hasLoadingImages()) {
        // Keep animating for pulse effect while loading
        fgRef.current?.resumeAnimation?.();
        animationFrame = requestAnimationFrame(animate);
      } else {
        animationFrame = null;
      }
    };

    const startAnimation = () => {
      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const unsubscribeLoad = onImageLoad(() => {
      // Force a redraw when image finishes loading
      const currentZoom = zoomRef.current || 1;
      fgRef.current?.zoom?.(currentZoom, 0);
    });

    const unsubscribeStart = onImageLoadStart(() => {
      // Start animation loop when image starts loading
      startAnimation();
    });

    // Start animation loop if images are already loading
    if (hasLoadingImages()) {
      startAnimation();
    }

    return () => {
      unsubscribeLoad();
      unsubscribeStart();
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    if (!show || !fgRef.current) return;
    if (!preparedData.nodes.length && !preparedData.links.length) return;
    const signature = dataSignature;
    if (signature && lastInitializedSignatureRef.current === signature) return;
    const fg = fgRef.current;

    // ===========================================
    // Simplified force configuration matching D3 defaults
    // D3's defaults are well-tuned for predictable behavior
    // dagMode adjusts values for hierarchical layouts
    // ===========================================

    // Charge force: nodes repel each other (D3 default is -30)
    // More negative = stronger repulsion/more spread out, Less negative = nodes closer together
    // KEY FIX: Reducing from -200 to -100 greatly reduced the "floating outward" drag effect
    fg.d3Force("charge")?.strength(dagMode ? -1230 : -120);

    // Link force: connected nodes attract each other
    const linkForce = fg.d3Force("link") as d3.ForceLink<PreparedNode<T>, L> | undefined;
    // Link distance: target spacing between connected nodes
    // Higher = more spread out, Lower = tighter clusters
    linkForce?.distance(dagMode ? 150 : 200);
    // Link strength: how strongly links pull nodes together
    // Higher = tighter/more rigid connections, Lower = more flexible/natural layout
    linkForce?.strength(dagMode ? 1 : 1.2);
    linkForce?.id((node: any) => node.id);

    // Centering forces: pull graph toward origin (D3 forceX/forceY default is 0.1)
    // Higher = stronger pull to center, Lower = allows more drift
    fg.d3Force("x", d3.forceX(0).strength(dagMode ? 0.01 : 0.03));
    fg.d3Force("y", d3.forceY(0).strength(dagMode ? 0.01 : 0.03));
    // Remove center force in favor of separate x/y forces for better control
    fg.d3Force("center", null);

    // Collision force: prevents nodes from overlapping
    // Higher strength/iterations = more rigid spacing but can cause bouncing
    // Lower = allows some overlap but smoother movement
    fg.d3Force(
      "collide",
      d3
        .forceCollide((node: any) => {
          const n = node as PreparedNode<T>;
          // Use partial label width to give some spacing without being too aggressive
          const labelWidth = estimateLabelWidth(n.label, LABEL_FONT_SIZE);
          const effectiveRadius = n.radius + (labelWidth * 0.4); // Only 40% of label width
          return effectiveRadius;
        })
        .iterations(1) // Single pass to minimize bouncing (higher = more accurate but can bounce)
        .strength(dagMode ? 0.02 : 0.2), // Very weak to prevent bouncing while still providing some spacing
    );
    if (selectedId) {
      // Pull only the selected node toward the origin to keep it in view
      fg.d3Force(
        "selected-position-x",
        d3.forceX<PreparedNode<T>>(0).strength((node) => (node.id === selectedId ? 0.15 : 0)),
      );
      fg.d3Force(
        "selected-position-y",
        d3.forceY<PreparedNode<T>>(0).strength((node) => (node.id === selectedId ? 0.15 : 0)),
      );
    } else {
      fg.d3Force("selected-position-x", null);
      fg.d3Force("selected-position-y", null);
    }

    // Radial layout for popularity stratification (concentric rings)
    if (radialLayout?.enabled && radialLayout.nodeToRadius.size > 0) {
      fg.d3Force(
        "radial",
        d3.forceRadial<PreparedNode<T>>(
          (node) => radialLayout.nodeToRadius.get(node.id) ?? 400,
          0, // center x
          0  // center y
        ).strength(radialLayout.strength ?? 0.3)
      );
    } else {
      fg.d3Force("radial", null);
    }

    fg.d3ReheatSimulation?.();
    if (shouldResetZoomRef.current) {
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      const defaultZoom = getDefaultGraphZoom(dagMode, isMobile);
      // Reset both zoom level and center position
      fg.centerAt(0, 0, 0);
      fg.zoom(defaultZoom, 0);
      zoomRef.current = defaultZoom;
      onZoomChangeRef.current?.(defaultZoom);
      shouldResetZoomRef.current = false;
    }
    if (signature) {
      lastInitializedSignatureRef.current = signature;
    }
  }, [dataSignature, dagMode, preparedData, selectedId, show, radialLayout]);

  useEffect(() => {
    if (!autoFocus || !show || !selectedId || !fgRef.current) return;
    const node = preparedData.nodes.find((n) => n.id === selectedId);
    if (!node) return;
    const centerToNode = () => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const currentZoom = zoomRef.current || 1;
      const yAdjusted = applyMobileDrawerYOffset(
        y,
        currentZoom,
        isMobile,
        DEFAULT_MOBILE_CENTER_OFFSET_PX,
      );
      const xAdjusted = applyDesktopDrawerXOffset(x, currentZoom, isDesktop, sidebarExpanded);
      fgRef.current!.centerAt(xAdjusted, yAdjusted, 600);
      const targetZoom = Math.max(0.8, Math.min(2.2, currentZoom < 1 ? 1.1 : currentZoom));
      fgRef.current!.zoom(targetZoom, 600);
    };
    centerToNode();
    const timeout = window.setTimeout(centerToNode, 300);
    return () => window.clearTimeout(timeout);
  }, [autoFocus, preparedData.nodes, selectedId, show, sidebarExpanded]);

  // Get hovered node data
  const hoveredNode = useMemo(() => {
      if (!hoveredId) return null;
      return preparedData.nodes.find(n => n.id === hoveredId) || null;
  }, [hoveredId, preparedData.nodes]);

  // Get screen position for hovered node
  const hoveredNodeScreenPos = useMemo(() => {
      if (!hoveredNode || !fgRef.current) return null;
      const node = hoveredNode as unknown as BasicNode & { x?: number; y?: number };
      if (node.x === undefined || node.y === undefined) return null;

      // Convert graph coordinates to screen coordinates
      const screenCoords = fgRef.current.graph2ScreenCoords?.(node.x, node.y);
      return screenCoords ? { x: screenCoords.x, y: screenCoords.y } : null;
  }, [hoveredNode]);

  // Notify parent of hover state changes
  useEffect(() => {
      if (onNodeHover) {
          onNodeHover(hoveredNode?.data, hoveredNodeScreenPos);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredId, hoveredNodeScreenPos]); // Don't include onNodeHover to avoid infinite loops

  // Smooth transition for dimming state changes
  useEffect(() => {
    const target = disableDimming ? 1 : 0;
    targetDimmingRef.current = target;

    // Start animation loop if not already running
    if (animationFrameRef.current === null) {
      lastFrameTimeRef.current = performance.now();

      // Resume graph rendering during transition (doesn't affect physics)
      fgRef.current?.resumeAnimation?.();

      const animate = () => {
        const now = performance.now();
        const deltaTime = (now - lastFrameTimeRef.current) / 1000; // Convert to seconds
        lastFrameTimeRef.current = now;

        const current = dimmingTransitionRef.current;
        const target = targetDimmingRef.current;
        const diff = target - current;

        // Stop if converged (within 0.01)
        if (Math.abs(diff) < 0.01) {
          dimmingTransitionRef.current = target;
          animationFrameRef.current = null;
          // Graph will auto-pause due to autoPauseRedraw
          return;
        }

        // Linear interpolation with speed factor (transition over ~300ms)
        const speed = 3.5; // Higher = faster transition
        const step = diff * speed * deltaTime;
        dimmingTransitionRef.current = current + step;

        // Continue animation (graph render loop handles the actual redraw)
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [disableDimming]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full relative active:cursor-grabbing"
      style={{
        height: height ?? "100%",
        // Always show container so loading spinner is visible, but disable pointer events when hidden
        display: (show || loading) ? "block" : "none",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ pointerEvents: "none" }}
        >
          <Loading />
        </div>
      )}
      <div style={{ visibility: show ? "visible" : "hidden" }}>
      <ForceGraph<PreparedNode<T>, L>
        ref={fgRef as any}
        width={width}
        height={height}
        graphData={preparedData}
        // Enables hierarchical radial layout (nodes arranged in concentric rings from center)
        dagMode={dagMode ? 'radialin' : undefined}
        // Pixel distance between hierarchy levels in DAG mode
        // Higher = more spread out layers, Lower = more compact hierarchy
        dagLevelDistance={dagMode ? 200 : undefined}
        // How quickly the simulation "cools down" (D3 default is 0.0228)
        // Higher = faster settling but less accurate layout, Lower = slower but more precise
        d3AlphaDecay={0.01}
        // Friction/damping on node velocity (D3 default is 0.4, using slightly higher for stability)
        // Higher = nodes stop faster/less drift, Lower = more fluid movement
        d3VelocityDecay={0.4}
        // Maximum time (ms) the simulation runs before auto-stopping
        // Higher = continues animating longer, Lower = freezes layout sooner
        cooldownTime={12000}
        // Pause canvas redraws when simulation is idle (performance optimization)
        autoPauseRedraw={true}
        nodeColor={() => "rgba(0,0,0,0)"}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={(link) => {
          if (!showLinksRef.current) return 'rgba(0,0,0,0)';
          const source =
            typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
          const target =
            typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
          const base = source ? colorById.get(String(source)) : undefined;
          const fallback = resolvedTheme === "dark" ? "#ffffff" : "#000000";
          const selected = !!effectiveSelectedId && (source === effectiveSelectedId || target === effectiveSelectedId);

          // Zoom-based fade: links become more transparent when zoomed out
          const zoom = zoomRef.current || 1;
          const zoomFade = Math.min(1, Math.max(0.15, zoom / 0.5)); // Fade below zoom 0.5, min 15% opacity

          // Calculate base opacity (reduced for less visual noise)
          const baseOpacity = effectiveSelectedId ? (selected ? 0xcc : 0x20) : 0x50;
          const undimmedOpacity = 0x50;

          // Interpolate between base and undimmed opacity, then apply zoom fade
          const transition = dimmingTransitionRef.current;
          const opacity = Math.round((baseOpacity * (1 - transition) + undimmedOpacity * transition) * zoomFade);
          const opacityHex = opacity.toString(16).padStart(2, '0');

          return `${base ?? fallback}${opacityHex}`;
        }}
        linkWidth={(link) => {
          if (!showLinksRef.current) return 0;
          const baseWidth = effectiveSelectedId ? (
            (() => {
              const source = typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
              const target = typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
              return source === effectiveSelectedId || target === effectiveSelectedId ? 2 : 0.3;
            })()
          ) : 0.5; // Reduced for less visual noise
          return baseWidth * linkThicknessScale;
        }}
        linkCurvature={dagMode ? 0 : linkCurvatureValue}
        onZoom={({ k }) => {
          zoomRef.current = k;
          onZoomChangeRef.current?.(k);
        }}
        onNodeHover={(node) => {
          const id = node?.id as string | undefined;
          setHoveredId(id);
          if (onNodeHover) {
            onNodeHover(id ? (node as PreparedNode<T>).data : undefined, {x: node?.x ?? 0, y: node?.y ?? 0});
          }
        }}
        onNodeClick={(node) => {
          onNodeClick?.((node as PreparedNode<T>).data);
        }}
        nodeCanvasObject={(node, ctx) => {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const baseRadius = node.radius;
          const radius = baseRadius * nodeScaleFactor; // Apply visual scaling from display controls
          const accent = colorById.get(node.id) ?? defaultColor;
          const isSelected = effectiveSelectedId === node.id;
          const isClickSelected = selectedId === node.id;
          const isNeighbor = hasSelection ? selectedNeighbors?.has(node.id) ?? false : false;
          const isHovered = hoveredId === node.id;

          // Calculate node alpha with smooth transition
          let baseAlpha = 1;
          if (hasSelection) {
            baseAlpha = isSelected ? 1 : isNeighbor ? 0.8 : 0.15;
          } else if (isHovered) {
            baseAlpha = 0.8;
          }

          // Interpolate between normal dimming and fully undimmed
          // dimmingTransition: 0 = normal dimming, 1 = fully undimmed
          const transition = dimmingTransitionRef.current;
          const alpha = baseAlpha * (1 - transition) + 1.0 * transition;

          // Build render context
          const renderContext: NodeRenderContext<T> = {
            ctx,
            node: node as SharedGraphNode<T>,
            x,
            y,
            radius,
            color: accent,
            isSelected,
            isClickSelected,
            isNeighbor,
            isHovered,
            alpha,
            theme: resolvedTheme as 'light' | 'dark' | undefined,
          };

          // Render node and selection ring if showNodes is true
          if (showNodesRef.current) {
            renderNode(renderContext);

            // Render selection ring only for click-based selection (not hover-based)
            if (isClickSelected) {
              renderSelection(renderContext);
            }
          }

          // Calculate and render label with smooth transition
          if (showLabels) {
            const k = zoomRef.current || 1;
            const zoomAlpha = labelAlphaForZoom(k, labelFadeStart, labelFadeEnd);
            const priorityZoomAlpha = labelAlphaForZoom(
              k,
              labelFadeStart * DEFAULT_PRIORITY_LABEL_ZOOM_SCALE,
              labelFadeEnd * DEFAULT_PRIORITY_LABEL_ZOOM_SCALE,
            );
            const isPriorityLabel = priorityLabelIds.has(node.id);
            let zoomBasedAlpha = applyLabelFadeCurve(isPriorityLabel ? priorityZoomAlpha : zoomAlpha);
            let meetsLabelThreshold = true;

            if (isPriorityLabel) {
              const minLabelValue = labelValueThresholdForZoom(
                priorityZoomAlpha,
                DEFAULT_PRIORITY_LABEL_IMPORTANCE_THRESHOLD,
              );
              meetsLabelThreshold = priorityZoomAlpha > 0;
              if (node.labelValue !== undefined && node.labelValue >= minLabelValue) {
                const denom = Math.max(1e-6, 1 - minLabelValue);
                const t = (node.labelValue - minLabelValue) / denom;
                const importanceAlpha = applyLabelFadeCurve(smoothstep(t));
                zoomBasedAlpha = Math.max(zoomBasedAlpha, importanceAlpha);
              }
            }

            if (meetsLabelThreshold || isSelected || isHovered) {
              // Calculate base label alpha (what it would be without dimming override)
              let baseLabelAlpha = zoomBasedAlpha;
              if (isSelected || isHovered) {
                baseLabelAlpha = 1;
              } else if (hasSelection && !isNeighbor) {
                baseLabelAlpha = Math.min(zoomBasedAlpha, 0.25);
              }

              // When transitioning to undimmed state, interpolate toward zoom-based alpha only
              // (we don't want to boost labels to full brightness, just remove selection dimming)
              const labelAlpha = baseLabelAlpha * (1 - transition) + zoomBasedAlpha * transition;

              const labelContext: LabelRenderContext<T> = {
                ...renderContext,
                label: node.label,
                labelAlpha,
                zoomLevel: k,
              };

              // Pass fontSize if using default renderer
              if (renderLabel === defaultRenderLabel) {
                // When nodes are hidden, use node color for labels
                const labelColor = !showNodesRef.current ? accent : undefined;
                const labelPx = isPriorityLabel
                  ? Math.max(labelFontSize, fontPxForZoom(labelFontSize, k))
                  : labelFontSize;
                defaultRenderLabel(labelContext, labelPx, labelColor, isPriorityLabel, isClickSelected);
              } else {
                renderLabel(labelContext);
              }
            }
          }
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          ctx.beginPath();
          ctx.arc(x, y, node.radius + 24, 0, 2 * Math.PI);
          ctx.fill();
        }}
        nodeVal={(node) => node.radius}
      />
      </div>
    </div>
  );
});

export default memo(Graph) as typeof Graph;
