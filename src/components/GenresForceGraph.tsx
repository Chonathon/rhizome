import { forwardRef, useMemo } from "react";
import Graph, {
  type GraphHandle,
  type SharedGraphNode,
} from "./Graph/Graph";
import { Genre, GenreClusterMode, GenreGraphData, NodeLink } from "@/types";

interface GenresForceGraphProps {
  graphData?: GenreGraphData;
  onNodeClick: (genre: Genre) => void;
  loading: boolean;
  show: boolean;
  dag: boolean;
  clusterModes: GenreClusterMode[];
  colorMap?: Map<string, string>;
  selectedGenreId?: string;
  autoFocus?: boolean;
  width?: number;
  height?: number;
}

const MIN_RADIUS = 6;
const MAX_RADIUS = 32;

const GenresForceGraph = forwardRef<GraphHandle, GenresForceGraphProps>(
  (
    {
      graphData,
      onNodeClick,
      loading,
      show,
      dag,
      // Cluster modes kept for compatibility but not used
      clusterModes: _clusterModes,
      colorMap,
      selectedGenreId,
      autoFocus,
      width,
      height,
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
        const radius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
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
        dagMode={dag}
        autoFocus={autoFocus}
        onNodeClick={onNodeClick}
      />
    );
  },
);

export type { GraphHandle };
export default GenresForceGraph;
