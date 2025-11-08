import { forwardRef, memo, useMemo } from "react";
import Graph, {
  type GraphHandle,
  type SharedGraphNode,
} from "./Graph";
import { Artist, NodeLink } from "@/types";

interface ArtistsForceGraphProps {
  artists: Artist[];
  artistLinks: NodeLink[];
  onNodeClick: (artist: Artist) => void;
  loading: boolean;
  show: boolean;
  selectedArtistId?: string;
  autoFocus?: boolean;
  computeArtistColor: (artist: Artist) => string;
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
}

const MIN_RADIUS = 6;
const MAX_RADIUS = 22;

const ArtistsForceGraph = forwardRef<GraphHandle, ArtistsForceGraphProps>(
  (
    {
      artists,
      artistLinks,
      onNodeClick,
      loading,
      show,
      selectedArtistId,
      autoFocus,
      computeArtistColor,
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
    },
    ref,
  ) => {
    const graphNodes = useMemo<SharedGraphNode<Artist>[]>(() => {
      if (!artists?.length) return [];
      const listenerValues = artists.map((artist) =>
        Math.log10(Math.max(1, artist.listeners || 1)),
      );
      const min = Math.min(...listenerValues);
      const max = Math.max(...listenerValues);
      const denom = Math.max(1e-6, max - min);

      return artists.map((artist) => {
        const value = Math.log10(Math.max(1, artist.listeners || 1));
        const t = (value - min) / denom;
        const radius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS); // Base radius only, no scaling
        return {
          id: artist.id,
          label: artist.name,
          radius,
          color: computeArtistColor(artist),
          data: artist,
        };
      });
    }, [artists, computeArtistColor]);

    const graphLinks = useMemo<NodeLink[]>(() => {
      if (!artistLinks?.length) return [];
      return artistLinks
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
    }, [artistLinks]);

    return (
      <Graph
        ref={ref}
        nodes={graphNodes}
        links={graphLinks}
        show={show}
        loading={loading}
        width={width}
        height={height}
        selectedId={selectedArtistId}
        autoFocus={autoFocus}
        onNodeClick={onNodeClick}
        nodeSize={nodeSize}
        linkThickness={linkThickness}
        linkCurvature={linkCurvature}
        showLabels={showLabels}
        labelSize={labelSize}
        textFadeThreshold={textFadeThreshold}
        showNodes={showNodes}
        showLinks={showLinks}
      />
    );
  },
);

export type { GraphHandle };
export default memo(ArtistsForceGraph);
