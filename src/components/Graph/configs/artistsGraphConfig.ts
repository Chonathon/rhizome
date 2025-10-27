import { GraphConfig } from '@/types/graph';
import { Artist, NodeLink } from '@/types';

/**
 * Example configuration for Artists Graph (Explore)
 *
 * Features:
 * - Force layout
 * - Color by genre (mixed colors for multi-genre artists)
 * - Size by listeners (log-scaled)
 * - Curved links below threshold
 * - Performance optimizations (link hiding, label fading)
 */
export function createArtistsGraphConfig(params: {
  artists: Artist[];
  links: NodeLink[];
  computeArtistColor: (artist: Artist) => string;
  onArtistClick: (artist: Artist) => void;
  onArtistHover?: (artist: Artist | null) => void;
  selectedArtistId?: string;
  width?: number;
  height?: number;
}): GraphConfig<Artist, NodeLink> {
  const {
    artists,
    links,
    computeArtistColor,
    onArtistClick,
    onArtistHover,
    selectedArtistId,
    width,
    height,
  } = params;

  // Precompute listener scale for log-based sizing
  const vals = artists.map(a => Math.max(1, a.listeners || 1));
  const min = Math.min(...vals, 1);
  const max = Math.max(...vals, 1);
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);

  const radiusFor = (artist: Artist) => {
    const v = Math.log10(Math.max(1, artist.listeners || 1));
    const t = (v - minLog) / Math.max(1e-6, maxLog - minLog);
    const rMin = 0.2;
    const rMax = 20;
    return rMin + t * (rMax - rMin);
  };

  return {
    nodes: artists,
    links: links,

    layout: {
      type: 'force',
      forceConfig: {
        charge: -100,
        linkDistance: 70,
        centerStrength: 0.1,
        collisionRadius: 1,
      },
    },

    styling: {
      nodeRadius: radiusFor,
      nodeColor: computeArtistColor,
      nodeLabel: (artist: Artist) => artist.name,
      nodeImage: (artist: Artist) => artist.image,
      linkColor: (link: NodeLink) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
        const connectedToSelected = !!selectedArtistId && (sourceId === selectedArtistId || targetId === selectedArtistId);

        // Use source node color for link
        const sourceArtist = artists.find(a => a.id === sourceId);
        const base = sourceArtist ? computeArtistColor(sourceArtist) : '#ffffff';
        const alpha = selectedArtistId ? (connectedToSelected ? 'ff' : '30') : '80';
        return base + alpha;
      },
      linkWidth: (link: NodeLink) => {
        if (!selectedArtistId) return 1;
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
        return (sourceId === selectedArtistId || targetId === selectedArtistId) ? 2.5 : 0.6;
      },
      linkCurvature: () => 0.2,
      highlightNeighbors: false, // Artists graph doesn't highlight neighbors
      curvedLinksAbove: 1500,
      maxLinksToShow: 6000,
      minLabelPx: 8,
      strokeMinPx: 13,
    },

    interactions: {
      onNodeClick: onArtistClick,
      onNodeHover: onArtistHover,
      enableZoom: true,
      enablePan: true,
      enableDrag: true,
      hideLinksBelowZoom: 0.1,
      labelFadeInStart: 0.1,
      labelFadeInEnd: 0.3,
    },

    controls: {
      showFind: true,
      showNodeCount: true,
    },

    state: {
      selectedNodeId: selectedArtistId,
    },

    width,
    height,
  };
}
