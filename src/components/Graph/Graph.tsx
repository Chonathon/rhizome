import {
  forwardRef,
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
  drawCircleNode,
  drawLabelBelow,
  applyMobileDrawerYOffset,
  DEFAULT_MOBILE_CENTER_OFFSET_PX,
  estimateLabelWidth,
} from "@/lib/graphStyle";
import type { GraphHandle } from "@/types";

export type { GraphHandle };

export interface SharedGraphNode<T = unknown> {
  id: string;
  label: string;
  radius: number;
  color?: string;
  data: T;
}

export interface SharedGraphLink {
  source: string;
  target: string;
}

export interface GraphProps<T, L extends SharedGraphLink> {
  nodes: SharedGraphNode<T>[];
  links: L[];
  show?: boolean;
  loading?: boolean;
  width?: number;
  height?: number;
  selectedId?: string;
  dagMode?: boolean;
  onNodeClick?: (node: T) => void;
  onNodeHover?: (node: T | undefined) => void;
}

type PreparedNode<T> = SharedGraphNode<T> & { x?: number; y?: number };

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
    dagMode = false,
    onNodeClick,
    onNodeHover,
  }: GraphProps<T, L>,
  ref: Ref<GraphHandle>,
) {
  const fgRef = useRef<ForceGraphMethods<PreparedNode<T>, L> | undefined>(undefined);
  const zoomRef = useRef<number>(1);
  const { resolvedTheme } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  const lastInitializedSignatureRef = useRef<string | undefined>(undefined);
  const shouldResetZoomRef = useRef(true);
  const preparedDataRef = useRef<GraphData<PreparedNode<T>, L> | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const cur = zoomRef.current || 1;
        const target = Math.min(20, cur * 2);
        fgRef.current?.zoom?.(target, 400);
      },
      zoomOut: () => {
        const cur = zoomRef.current || 1;
        const target = Math.max(0.03, cur / 2);
        fgRef.current?.zoom?.(target, 400);
      },
      zoomTo: (k: number, ms = 400) => {
        const target = Math.max(0.03, Math.min(20, k));
        fgRef.current?.zoom?.(target, ms);
      },
      getZoom: () => zoomRef.current || 1,
    }),
    [],
  );

  const preparedData: GraphData<PreparedNode<T>, L> = useMemo(() => {
    const clonedNodes = nodes.map((node) => ({ ...node }));
    const clonedLinks = links.map((link) => ({ ...link }));
    return { nodes: clonedNodes, links: clonedLinks };
  }, [nodes, links]);

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
  const hasSelection = !!selectedId;
  const selectedNeighbors = hasSelection && selectedId ? neighborsById.get(selectedId) : undefined;

  useEffect(() => {
    if (preparedDataRef.current !== preparedData) {
      // Snapshot new data so rerenders caused by props toggling do not retrigger reheats.
      preparedDataRef.current = preparedData;
      lastInitializedSignatureRef.current = undefined;
      shouldResetZoomRef.current = true;
    }
  }, [preparedData]);

  useEffect(() => {
    // Pause instead of unmounting so the physics state survives hidden periods.
    if (!fgRef.current) return;
    if (show) fgRef.current.resumeAnimation();
    else fgRef.current.pauseAnimation();
  }, [show]);
// oi
  useEffect(() => {
    if (!show || !fgRef.current) return;
    if (!preparedData.nodes.length && !preparedData.links.length) return;
    const signature = dataSignature;
    if (signature && lastInitializedSignatureRef.current === signature) return;
    const fg = fgRef.current;

    // Standardized force configuration
    fg.d3Force("charge")?.strength(dagMode ? -1230 : -200);
    const linkForce = fg.d3Force("link") as d3.ForceLink<PreparedNode<T>, L> | undefined;
    linkForce?.distance(dagMode ? 150 : 90);
    linkForce?.strength(dagMode ? 1 : 1.6);
    linkForce?.id((node: any) => node.id);
    fg.d3Force("center", d3.forceCenter(0, 0).strength(dagMode ? 0.01 : 0.05));
    fg.d3Force(
      "collide",
      d3
        .forceCollide((node: any) => {
          const n = node as PreparedNode<T>;
          // Include label dimensions in collision radius to prevent label overlap
          const labelWidth = estimateLabelWidth(n.label, LABEL_FONT_SIZE);
          const labelHeight = LABEL_FONT_SIZE;
          const labelDiagonal = Math.sqrt(labelWidth * labelWidth + labelHeight * labelHeight) / 2;
          const padding = 10;
          // Use the larger of node radius or label dimensions
          return Math.max(n.radius + padding, labelDiagonal + padding);
        })
        .iterations(2)
        .strength(dagMode ? 0.02 : 0.7),
    );
    fg.d3ReheatSimulation?.();
    if (shouldResetZoomRef.current) {
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      // Reset both zoom level and center position
      fg.centerAt(0, 0, 0);
      fg.zoom(dagMode ? 0.25 : (isMobile ? 0.12 : 0.14), 0);
      zoomRef.current = dagMode ? 0.25 : (isMobile ? 0.12 : 0.18);
      shouldResetZoomRef.current = false;
    }
    if (signature) {
      lastInitializedSignatureRef.current = signature;
    }
  }, [dataSignature, dagMode, preparedData, show]);

  useEffect(() => {
    if (!show || !selectedId || !fgRef.current) return;
    const node = preparedData.nodes.find((n) => n.id === selectedId);
    if (!node) return;
    const centerToNode = () => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      const currentZoom = zoomRef.current || 1;
      const yAdjusted = applyMobileDrawerYOffset(
        y,
        currentZoom,
        isMobile,
        DEFAULT_MOBILE_CENTER_OFFSET_PX,
      );
      fgRef.current!.centerAt(x, yAdjusted, 600);
      const targetZoom = Math.max(0.8, Math.min(2.2, currentZoom < 1 ? 1.1 : currentZoom));
      fgRef.current!.zoom(targetZoom, 600);
    };
    centerToNode();
    const timeout = window.setTimeout(centerToNode, 300);
    return () => window.clearTimeout(timeout);
  }, [preparedData.nodes, selectedId, show]);

  return (
    <div
      className="flex-1 w-full relative"
      style={{
        height: height ?? "100%",
        display: show ? "block" : "none", // Keep the canvas mounted while simply hiding it.
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
      <ForceGraph<PreparedNode<T>, L>
        ref={fgRef as any}
        width={width}
        height={height}
        graphData={preparedData}
        dagMode={dagMode ? 'radialin' : undefined}
        dagLevelDistance={dagMode ? 200 : undefined}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.75}
        cooldownTime={12000}
        autoPauseRedraw={true}
        nodeColor={() => "rgba(0,0,0,0)"}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={(link) => {
          const source =
            typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
          const target =
            typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
          const base = source ? colorById.get(String(source)) : undefined;
          const fallback = resolvedTheme === "dark" ? "#ffffff" : "#000000";
          const selected = !!selectedId && (source === selectedId || target === selectedId);
          return `${base ?? fallback}${selectedId ? (selected ? 'cc' : '30') : '80'}`;
        }}
        linkWidth={(link) => {
          if (!selectedId) return 1;
          const source =
            typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
          const target =
            typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
          return source === selectedId || target === selectedId ? 2.5 : 0.6;
        }}
        linkCurvature={dagMode ? 0 : 0.5}
        onZoom={({ k }) => {
          zoomRef.current = k;
        }}
        onNodeHover={(node) => {
          const id = node?.id as string | undefined;
          setHoveredId(id);
          if (onNodeHover) onNodeHover(id ? (node as PreparedNode<T>).data : undefined);
        }}
        onNodeClick={(node) => {
          onNodeClick?.((node as PreparedNode<T>).data);
        }}
        nodeCanvasObject={(node, ctx) => {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const radius = node.radius;
          const accent = colorById.get(node.id) ?? defaultColor;
          const isSelected = selectedId === node.id;
          const isNeighbor = hasSelection ? selectedNeighbors?.has(node.id) ?? false : false;
          const isHovered = hoveredId === node.id;

          // Calculate node alpha
          let alpha = 1;
          if (hasSelection) {
            alpha = isSelected ? 1 : isNeighbor ? 0.8 : 0.15;
          } else if (isHovered) {
            alpha = 0.8;
          }

          // Draw node circle
          ctx.save();
          ctx.globalAlpha = alpha;
          drawCircleNode(ctx, x, y, radius, accent);
          ctx.restore();

          // Draw selection ring
          if (isSelected) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
          }

          // Calculate and draw label
          const k = zoomRef.current || 1;
          let labelAlpha = labelAlphaForZoom(k, DEFAULT_LABEL_FADE_START, DEFAULT_LABEL_FADE_END);
          if (isSelected || isHovered) labelAlpha = 1;
          else if (hasSelection && !isNeighbor) labelAlpha = Math.min(labelAlpha, 0.25);
          drawLabelBelow(ctx, node.label, x, y, radius, resolvedTheme, labelAlpha, LABEL_FONT_SIZE);
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
  );
});

export default Graph;
