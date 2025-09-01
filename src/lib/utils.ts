import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  Artist,
  BasicNode,
  Genre,
  GenreClusterMode,
  GenreGraphData,
  NodeLink
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

export const envBoolean = (value: string) => {
  return value && (value.toLowerCase() === 'true' || parseInt(value) === 1);
}

export const generateArtistLinks = (artist: Artist, similarCount: number) => {
  const links = [];
  for (let i = 0; i < similarCount - 1; i++) {
    links.push({ source: artist.id, target: i.toString() });
  }
  return links;
}

export const generateSimilarLinks = (artists: Artist[]) => {
  const links: NodeLink[] = [];
  for (let i = 1; i < artists.length; i++) {
    links.push({ source: artists[0].id, target: artists[i].id, linkType: 'similar' });
  }
  return links;
}

export const isGenre = (item: BasicNode) => {
  return "artistCount" in item;
}

export const genreHasChildren = (genre: Genre, genreClusterMode: GenreClusterMode) => {
  switch (genreClusterMode) {
    case "subgenre":
      return genre.subgenres.length > 0;
    case "influence":
      return genre.influenced_genres.length > 0;
    case "fusion":
      return genre.fusion_genres.length > 0;
    default:
      return false;
  }
}

export const isTopLevelGenre = (genre: Genre, genreClusterMode: GenreClusterMode) => {
  switch (genreClusterMode) {
      case "subgenre":
        return genre.subgenre_of.length === 0 && genre.subgenres.length > 0;
      case "influence":
        return genre.influenced_by.length === 0 && genre.influenced_genres.length > 0;
      case "fusion":
        return genre.fusion_of.length === 0 && genre.fusion_genres.length > 0;
    default:
      return false;
  }
}

export const buildGenreTree = (genres: Genre[], parent: Genre, mode: GenreClusterMode) => {
  const nodes: Genre[] = [];
  const links: NodeLink[] = [];
  const genresMap = new Map<string, Genre>();
  genres.forEach(genre => {
    genresMap.set(genre.id, genre);
  });
  // Add parent
  nodes.push(parent);

  const addChildren = (parentId: string, level: number) => {
    const genre = genresMap.get(parentId);
    if (!genre) return;

    let children: BasicNode[] = [];
    if (mode === 'subgenre') {
      children = genre.subgenres;
    } else if (mode === 'influence') {
      children = genre.influenced_genres;
    } else if (mode === 'fusion') {
      children = genre.fusion_genres;
    }

    for (const child of children) {
      const childId = child.id;
      const childGenre = genresMap.get(childId);
      if (childGenre) {
        nodes.push(childGenre);
        links.push({ source: parentId, target: childId });
      }
      addChildren(childId, level + 1);
    }
  };
  addChildren(parent.id, 1);
  // console.log(`Original nodes: ${genres.length} Filtered nodes: ${nodes.length}`);
  // console.log(`Filtered links: ${links.length}`);
  return { nodes, links };
};

export const filterOutGenreTree = (genreGraphData: GenreGraphData, parent: Genre, mode: GenreClusterMode) => {
  const nodesToFilter = new Set<string>();
  const genresMap = new Map<string, Genre>();
  genreGraphData.nodes.forEach(genre => {
    genresMap.set(genre.id, genre);
  });
  // Add parent
  nodesToFilter.add(parent.id);

  const addChildren = (parentId: string, level: number) => {
    const genre = genresMap.get(parentId);
    if (!genre) return;

    let children: BasicNode[] = [];
    if (mode === 'subgenre') {
      children = genre.subgenres;
    } else if (mode === 'influence') {
      children = genre.influenced_genres;
    } else if (mode === 'fusion') {
      children = genre.fusion_genres;
    }

    for (const child of children) {
      const childId = child.id;
      const childGenre = genresMap.get(childId);
      if (childGenre) {
        nodesToFilter.add(childId);
      }
      addChildren(childId, level + 1);
    }
  };

  addChildren(parent.id, 1);

  const filteredNodes = genreGraphData.nodes.filter(node => !nodesToFilter.has(node.id));
  const filteredLinks = genreGraphData.links.filter(link => {
    return !(nodesToFilter.has(link.source) || nodesToFilter.has(link.target));
  });

  // console.log(`Original nodes: ${genreGraphData.nodes.length} Filtered nodes: ${filteredNodes.length}`);
  // console.log(`Original links: ${genreGraphData.links.length} Filtered links: ${filteredLinks.length}`);
  return { nodes: filteredNodes, links: filteredLinks };
}

// Tailwind default color palette (lighter/less saturated variants)
// Uses -300 and -400 shades across hues for good visibility on dark backgrounds
// while staying softer than 500/600.
export const clusterColors = [
  // 300 shades
  "#fca5a5", // red-300
  "#fdba74", // orange-300
  "#fcd34d", // amber-300
  "#fde047", // yellow-300
  "#bef264", // lime-300
  "#86efac", // green-300
  "#6ee7b7", // emerald-300
  "#5eead4", // teal-300
  "#67e8f9", // cyan-300
  "#7dd3fc", // sky-300
  "#93c5fd", // blue-300
  "#a5b4fc", // indigo-300
  "#c4b5fd", // violet-300
  "#d8b4fe", // purple-300
  "#f0abfc", // fuchsia-300
  "#f9a8d4", // pink-300
  "#fda4af", // rose-300

  // 400 shades (slightly stronger, still soft)
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#fbbf24", // amber-400
  "#facc15", // yellow-400
  "#a3e635", // lime-400
  "#4ade80", // green-400
  "#34d399", // emerald-400
  "#2dd4bf", // teal-400
  "#22d3ee", // cyan-400
  "#38bdf8", // sky-400
  "#60a5fa", // blue-400
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c084fc", // purple-400
  "#e879f9", // fuchsia-400
  "#f472b6", // pink-400
  "#fb7185", // rose-400
];

// Build a stable color map for genres based on their top-level parents.
// Returns a Map keyed by both genre id and lowercase name for easier lookup.
export const buildGenreRootColorMap = (genres: Genre[], links: NodeLink[]) => {
  const colorMap = new Map<string, string>();
  if (!genres?.length) return colorMap;

  const nodes = genres.map(g => ({ id: g.id, name: g.name }));
  const preparedLinks = links.map(l => ({
    source: typeof l.source === 'string' ? l.source : (l as any).source?.id,
    target: typeof l.target === 'string' ? l.target : (l as any).target?.id,
  })).filter(l => l.source && l.target) as {source: string, target: string}[];

  // parent map child -> Set(parent)
  const parents = new Map<string, Set<string>>();
  preparedLinks.forEach(l => {
    if (!parents.has(l.target)) parents.set(l.target, new Set());
    parents.get(l.target)!.add(l.source);
    if (!parents.has(l.source)) parents.set(l.source, parents.get(l.source) || new Set());
  });

  const nodeIds = nodes.map(n => n.id);
  const indegree = new Map<string, number>(nodeIds.map(id => [id, 0]));
  preparedLinks.forEach(l => indegree.set(l.target, (indegree.get(l.target) || 0) + 1));
  const roots = nodeIds.filter(id => (indegree.get(id) || 0) === 0);

  const nodeById = new Map(nodes.map(n => [n.id, n] as const));
  const sortedRoots = roots
    .map(id => nodeById.get(id)!)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  sortedRoots.forEach((n, i) => {
    const color = clusterColors[i % clusterColors.length];
    colorMap.set(n.id, color);
    colorMap.set(n.name.toLowerCase(), color);
  });

  const getRootColor = (id: string, hopGuard = 0): string | undefined => {
    if (colorMap.has(id)) return colorMap.get(id);
    if (hopGuard > 1000) return undefined;
    const p = parents.get(id);
    if (!p || p.size === 0) return undefined;
    const parentId = Array.from(p).sort()[0];
    const c = getRootColor(parentId, hopGuard + 1);
    if (c) colorMap.set(id, c);
    return c;
  };
  nodeIds.forEach(id => {
    if (!colorMap.has(id)) {
      const c = getRootColor(id);
      if (c) colorMap.set(id, c);
    }
  });

  // Also alias names to colors for convenience
  nodes.forEach(n => {
    const c = colorMap.get(n.id);
    if (c) colorMap.set(n.name.toLowerCase(), c);
  });

  return colorMap;
}

export const fixWikiImageURL = (url: string) => {
  if (url.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    const filename = url.substring(url.lastIndexOf('/') + 1);
    return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + filename;
  }
  return url;
}
