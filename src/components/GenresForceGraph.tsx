import { forwardRef, memo, useMemo } from "react";
import Graph, {
  type GraphHandle,
  type SharedGraphNode,
} from "./Graph";
import { Genre, GenreClusterMode, GenreGraphData, NodeLink } from "@/types";

interface GenresForceGraphProps {
  graphData?: GenreGraphData;
  onNodeClick: (genre: Genre) => void;
  onNodeHover?: (genreId: string | null, screenPosition: { x: number; y: number } | null) => void;
  loading: boolean;
  show: boolean;
  dag: boolean;
  clusterModes: GenreClusterMode[];
  colorMap?: Map<string, string>;
  selectedGenreId?: string;
  hoverSelectedId?: string | null;
  autoFocus?: boolean;
  width?: number;
  height?: number;
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
}

const MIN_RADIUS = 4;
const MAX_RADIUS = 50;

const GenresForceGraph = forwardRef<GraphHandle, GenresForceGraphProps>(
  (
    {
      graphData,
      onNodeClick,
      onNodeHover,
      loading,
      show,
      dag,
      // Cluster modes kept for compatibility but not used
      clusterModes: _clusterModes,
      colorMap,
      selectedGenreId,
      hoverSelectedId,
      autoFocus,
      width,
      height,
      nodeSize,
      linkThickness,
      linkCurvature,
      showLabels,
      labelSize,
      textFadeThreshold,
      showNodes,
      showLinks,
      disableDimming,
    },
    ref,
  ) => {
    const graphNodes = useMemo<SharedGraphNode<Genre>[]>(() => {
      const nodes = graphData?.nodes ?? [];
      if (!nodes.length) return [];

      const artistCounts = nodes.map((genre) =>
        Math.log10(Math.max(1, genre.artistCount || 1)),
      );
      const min = Math.min(...artistCounts);
      const max = Math.max(...artistCounts);
      const denom = Math.max(1e-6, max - min);

      return nodes.map((genre) => {
        const value = Math.log10(Math.max(1, genre.artistCount || 1));
        const t = (value - min) / denom;
        const radius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS); // Base radius only, no scaling
        return {
          id: genre.id,
          label: genre.name,
          radius,
          color: colorMap?.get(genre.id),
          data: genre,
        };
      });
    }, [graphData, colorMap]);

    const graphLinks = useMemo<NodeLink[]>(() => {
      const links = graphData?.links ?? [];
      if (!links.length) return [];
      return links
        .map((link) => {
          const source =
            typeof link.source === "string" ? link.source : (link.source as { id?: string })?.id;
          const target =
            typeof link.target === "string" ? link.target : (link.target as { id?: string })?.id;
          if (!source || !target) return undefined;
          return {
            source,
            target,
            linkType: link.linkType,
          } satisfies NodeLink;
        })
        .filter((link): link is NodeLink => Boolean(link));
    }, [graphData]);

    return (
      <Graph
        ref={ref}
        nodes={graphNodes}
        links={graphLinks}
        show={show}
        loading={loading}
        width={width}
        height={height}
        selectedId={selectedGenreId}
        hoverSelectedId={hoverSelectedId}
        dagMode={dag}
        autoFocus={autoFocus}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover ? (genre, screenPosition) => onNodeHover((genre as Genre | undefined)?.id ?? null, screenPosition) : undefined}
        nodeSize={nodeSize}
        linkThickness={linkThickness}
        linkCurvature={linkCurvature}
        showLabels={showLabels}
        labelSize={labelSize}
        textFadeThreshold={textFadeThreshold}
        showNodes={showNodes}
        showLinks={showLinks}
        disableDimming={disableDimming}
      />
    );
  },
);

export type { GraphHandle };
export default memo(GenresForceGraph);
