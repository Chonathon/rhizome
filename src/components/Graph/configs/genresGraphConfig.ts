import { GraphConfig } from '@/types/graph';
import { Genre, NodeLink } from '@/types';

/**
 * Example configuration for Genres Graph
 *
 * Features:
 * - DAG or force layout (toggleable)
 * - Color by root genre
 * - Size by artist count
 * - Link filtering by cluster mode
 * - Neighbor highlighting on selection
 */
export function createGenresGraphConfig(params: {
  genres: Genre[];
  links: NodeLink[];
  colorMap: Map<string, string>;
  onGenreClick: (genre: Genre) => void;
  onGenreHover?: (genre: Genre | null) => void;
  selectedGenreId?: string;
  dag?: boolean;
  width?: number;
  height?: number;
}): GraphConfig<Genre, NodeLink> {
  const {
    genres,
    links,
    colorMap,
    onGenreClick,
    onGenreHover,
    selectedGenreId,
    dag = false,
    width,
    height,
  } = params;

  return {
    nodes: genres,
    links: links,

    layout: {
      type: dag ? 'dag' : 'force',
      forceConfig: dag
        ? {
            charge: -1230,
            linkDistance: 150,
            centerStrength: 0.01,
            collisionRadius: 1,
          }
        : {
            charge: -70,
            linkDistance: 70,
            centerStrength: 0.1,
            collisionRadius: 1,
          },
      dagConfig: dag
        ? {
            direction: 'TB', // Top to bottom
            levelSpacing: 200,
          }
        : undefined,
    },

    styling: {
      nodeRadius: (genre: Genre) => {
        return 5 + Math.sqrt(genre.artistCount || 0) * 0.5;
      },
      nodeColor: (genre: Genre) => {
        return colorMap.get(genre.id) || '#8a80ff';
      },
      nodeLabel: (genre: Genre) => genre.name,
      linkColor: (link: NodeLink) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
        const connectedToSelected = !!selectedGenreId && (sourceId === selectedGenreId || targetId === selectedGenreId);
        const base = colorMap.get(sourceId) || '#ffffff';
        const alpha = selectedGenreId ? (connectedToSelected ? 'cc' : '30') : '80';
        return base + alpha;
      },
      linkWidth: (link: NodeLink) => {
        if (!selectedGenreId) return 1;
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
        return (sourceId === selectedGenreId || targetId === selectedGenreId) ? 2.5 : 0.6;
      },
      linkCurvature: () => dag ? 0 : 0.5,
      highlightNeighbors: true,
      selectedNodeColor: undefined,
      hoveredNodeColor: undefined,
    },

    interactions: {
      onNodeClick: onGenreClick,
      onNodeHover: onGenreHover,
      enableZoom: true,
      enablePan: true,
      enableDrag: true,
      labelFadeInStart: 0.1,
      labelFadeInEnd: 0.3,
    },

    controls: {
      showFind: true,
      showNodeCount: true,
      enableDagToggle: true,
      enableLayoutReset: true,
    },

    state: {
      selectedNodeId: selectedGenreId,
    },

    width,
    height,
  };
}
