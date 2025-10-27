import { GraphConfig } from '@/types/graph';
import { Artist, NodeLink } from '@/types';

/**
 * Example configuration for Similar Artists Graph
 *
 * Features:
 * - Star topology (fixed center node)
 * - Center artist larger than outer nodes
 * - Color by genre
 * - No dragging (fixed layout)
 * - Simple, focused view (no complex controls)
 */
export function createSimilarArtistsGraphConfig(params: {
  centerArtist: Artist;
  similarArtists: Artist[];
  links: NodeLink[];
  computeArtistColor: (artist: Artist) => string;
  onArtistClick: (artist: Artist) => void;
  onArtistHover?: (artist: Artist | null) => void;
  width?: number;
  height?: number;
}): GraphConfig<Artist, NodeLink> {
  const {
    centerArtist,
    similarArtists,
    links,
    computeArtistColor,
    onArtistClick,
    onArtistHover,
    width,
    height,
  } = params;

  const allArtists = [centerArtist, ...similarArtists];

  return {
    nodes: allArtists,
    links: links,

    layout: {
      type: 'star',
      starConfig: {
        centerNodeId: centerArtist.id,
        radiusSpacing: 200,
      },
    },

    styling: {
      nodeRadius: (artist: Artist) => {
        // Center node is larger
        return artist.id === centerArtist.id ? 20 : 12;
      },
      nodeColor: computeArtistColor,
      nodeLabel: (artist: Artist) => artist.name,
      nodeImage: (artist: Artist) => artist.image,
      linkColor: () => '#808080', // Uniform gray for similar artist links
      linkWidth: () => 1,
      linkCurvature: () => 0, // Straight lines in star topology
      highlightNeighbors: false,
    },

    interactions: {
      onNodeClick: onArtistClick,
      onNodeHover: onArtistHover,
      enableZoom: true,
      enablePan: true,
      enableDrag: false, // Fixed layout, no dragging
      labelFadeInStart: 0.1,
      labelFadeInEnd: 0.3,
    },

    controls: {
      // No controls for simple star graph
      showFind: false,
      showNodeCount: false,
    },

    state: {
      selectedNodeId: centerArtist.id,
    },

    width,
    height,
  };
}
