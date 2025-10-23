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
import { Loading } from "./Loading";
import {
  LABEL_FONT_SIZE,
  DEFAULT_LABEL_FADE_START,
  DEFAULT_LABEL_FADE_END,
  labelAlphaForZoom,
  drawCircleNode,
  drawLabelBelow,
  applyMobileDrawerYOffset,
  DEFAULT_MOBILE_CENTER_OFFSET_PX,
} from "@/lib/graphStyle";

export type GraphHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (k: number, ms?: number) => void;
  getZoom: () => number;
};

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

export interface SharedForceGraphProps<T, L extends SharedGraphLink> {
  nodes: SharedGraphNode<T>[];
  links: L[];
  show?: boolean;
  loading?: boolean;
  width?: number;
  height?: number;
  selectedId?: string;
  onNodeClick?: (node: T) => void;
  onNodeHover?: (node: T | undefined) => void;
}

type PreparedNode<T> = SharedGraphNode<T> & { x?: number; y?: number };

const SharedForceGraph = forwardRef(function SharedForceGraphInner<
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
    onNodeClick,
    onNodeHover,
  }: SharedForceGraphProps<T, L>,
  ref: Ref<GraphHandle>,
) {
  const fgRef = useRef<ForceGraphMethods<PreparedNode<T>, L>>();
  const zoomRef = useRef<number>(1);
  const { theme } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  const lastInitializedSignatureRef = useRef<string>();
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
    const defaultColor = theme === "dark" ? "#8a80ff" : "#4a4a4a";
    return new Map(preparedData.nodes.map((node) => [node.id, node.color ?? defaultColor]));
  }, [preparedData.nodes, theme]);

  const neighborsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    preparedData.nodes.forEach((n) => map.set(n.id, new Set()));
    preparedData.links.forEach((link) => {
      const source = typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
      const target = typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
      if (!source || !target) return;
      if (!map.has(source)) map.set(source, new Set());
      if (!map.has(target)) map.set(target, new Set());
      map.get(source)!.add(target);
      map.get(target)!.add(source);
    });
    return map;
  }, [preparedData]);

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

  useEffect(() => {
    if (!show || !fgRef.current) return;
    if (!preparedData.nodes.length && !preparedData.links.length) return;
    const signature = dataSignature;
    if (signature && lastInitializedSignatureRef.current === signature) return;
    const fg = fgRef.current;
    fg.d3Force("charge")?.strength(-130);
    const linkForce = fg.d3Force("link") as d3.ForceLink<PreparedNode<T>, L> | undefined;
    linkForce?.distance(80);
    linkForce?.strength(0.8);
    linkForce?.id((node: any) => node.id);
    fg.d3Force("center", d3.forceCenter(0, 0).strength(0.1));
    fg.d3Force(
      "collide",
      d3
        .forceCollide((node: any) => {
          const n = node as PreparedNode<T>;
          return n.radius + 10;
        })
        .iterations(2)
        .strength(0.7),
    );
    fg.d3ReheatSimulation?.();
    if (shouldResetZoomRef.current) {
      fg.zoom(0.18);
      zoomRef.current = 0.18;
      shouldResetZoomRef.current = false;
    }
    if (signature) {
      lastInitializedSignatureRef.current = signature;
    }
  }, [dataSignature, preparedData, show]);

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
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.75}
        cooldownTime={12000}
        autoPauseRedraw={false}
        nodeColor={() => "rgba(0,0,0,0)"}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={(link) => {
          const source =
            typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
          const target =
            typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
          const base = source ? colorById.get(source) : undefined;
          const fallback = theme === "dark" ? "#ffffff" : "#000000";
          const selected = !!selectedId && (source === selectedId || target === selectedId);
          return `${base ?? fallback}${selected ? "cc" : "40"}`;
        }}
      linkWidth={(link) => {
        if (!selectedId) return 1;
        const source =
          typeof link.source === "string" ? link.source : (link.source as NodeObject)?.id;
        const target =
          typeof link.target === "string" ? link.target : (link.target as NodeObject)?.id;
        return source === selectedId || target === selectedId ? 2.5 : 0.6;
      }}
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
        const accent = colorById.get(node.id) ?? (theme === "dark" ? "#8a80ff" : "#4a4a4a");
        const hasSelection = !!selectedId;
        const isSelected = selectedId === node.id;
        const isNeighbor = hasSelection ? neighborsById.get(selectedId!)?.has(node.id) : false;
        const isHovered = hoveredId === node.id;

        let alpha = 1;
        if (hasSelection) {
          alpha = isSelected ? 1 : isNeighbor ? 0.8 : 0.15;
        } else if (isHovered) {
          alpha = 0.9;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        drawCircleNode(ctx, x, y, radius, accent);
        ctx.restore();

        if (isSelected) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        const k = zoomRef.current || 1;
        let labelAlpha = labelAlphaForZoom(k, DEFAULT_LABEL_FADE_START, DEFAULT_LABEL_FADE_END);
        if (isSelected || isHovered) labelAlpha = 1;
        else if (hasSelection && !isNeighbor) labelAlpha = Math.min(labelAlpha, 0.25);
        drawLabelBelow(ctx, node.label, x, y, radius, theme, labelAlpha, LABEL_FONT_SIZE);
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

export default SharedForceGraph;
