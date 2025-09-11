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

export const isTopLevelGenre = (genre: Genre, genreClusterModes: GenreClusterMode[]) => {
  let isRoot = false;
  genreClusterModes.forEach((mode: GenreClusterMode) => {
    if (genre[parentFieldMap[mode]].length > 0 && genre[childFieldMap[mode]].length === 0) isRoot = true;
  });
  return isRoot;
}

export const parentFieldMap: {
  subgenre: "subgenres";
  influence: "influenced_genres";
  fusion: "fusion_genres";
} = {
  subgenre: 'subgenres',
  influence: 'influenced_genres',
  fusion: 'fusion_genres',
}

export const childFieldMap: {
  subgenre: 'subgenre_of',
  influence: 'influenced_by',
  fusion: 'fusion_of'
} = {
  subgenre: 'subgenre_of',
  influence: 'influenced_by',
  fusion: 'fusion_of',
}

export const buildGenreTree = (genres: Genre[], parent: Genre, modes: GenreClusterMode[]) => {
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

    let children: {id: string, name: string, mode: GenreClusterMode}[] = [];
    modes.forEach((mode) => {
      children.push(...genre[parentFieldMap[mode]].map(g => {
        return {...g, mode};
      }))
    });

    for (const child of children) {
      const childId = child.id;
      const childGenre = genresMap.get(childId);
      if (childGenre) {
        nodes.push(childGenre);
        links.push({ source: parentId, target: childId, linkType: child.mode });
      }
      addChildren(childId, level + 1);
    }
  };
  addChildren(parent.id, 1);
  // console.log(`Original nodes: ${genres.length} Filtered nodes: ${nodes.length}`);
  // console.log(`Filtered links: ${links.length}`);
  return { nodes, links };
};

export const filterOutGenreTree = (genreGraphData: GenreGraphData, parent: Genre, modes: GenreClusterMode[]) => {
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

    let children: {id: string, name: string, mode: GenreClusterMode}[] = [];
    modes.forEach((mode) => {
      children.push(...genre[parentFieldMap[mode]].map(g => {
        return {...g, mode};
      }))
    });

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

export const assignRootGenreColors = (rootIDs: string[]) => {
  const colorMap = new Map<string, string>();
  if (!rootIDs.length) return colorMap;
  const sortedRoots = [...rootIDs].sort((a, b) => a.localeCompare(b));
  sortedRoots.forEach((n, i) => {
    const color = clusterColors[i % clusterColors.length];
    colorMap.set(n, color);
  });
  return colorMap;
}

export const buildGenreColorMap = (genres: Genre[], rootIDs: string[]) => {
  const rootColorMap = assignRootGenreColors(rootIDs);
  const colorMap = new Map<string, string>();
  let singletonCount = 0;
  genres.forEach(genre => {
    switch (genre.rootGenres.length) {
      case 0:
        colorMap.set(genre.id, getSingletonColor(singletonCount));
        singletonCount++;
        break;
      case 1:
        const color = rootColorMap.get(genre.rootGenres[0]);
        if (color) colorMap.set(genre.id, color);
        else {
          colorMap.set(genre.id, getSingletonColor(singletonCount));
          singletonCount++;
        }
        break;
      default:
        if (!genre.rootGenres || genre.rootGenres.length < 2) {
          colorMap.set(genre.id, getSingletonColor(singletonCount));
          singletonCount++;
        } else {
          const colors: string[] = [];
          genre.rootGenres.forEach((g) => {
            const curRoot = rootColorMap.get(g);
            if (curRoot) colors.push(curRoot);
          });
          colorMap.set(genre.id, mixColors(colors));
        }
    }
  });
  return colorMap;
}

export const getSingletonColor = (count: number) => {
  return clusterColors[count % clusterColors.length];
}

// --- Color utilities ---
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 8) h = h.slice(0, 6); // ignore alpha
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const cr = clamp(r), cg = clamp(g), cb = clamp(b);
  return `#${toHex(cr)}${toHex(cg)}${toHex(cb)}`;
};

const relLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const srgb = [rgb.r, rgb.g, rgb.b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const contrastRatio = (hex1: string, hex2: string): number => {
  const L1 = relLuminance(hex1);
  const L2 = relLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Darken a color by blending with black by a factor in [0,1]
const darken = (hex: string, factor: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - factor), rgb.g * (1 - factor), rgb.b * (1 - factor));
};

// Ensure color has at least minRatio contrast on a light background by darkening as needed
export const ensureContrastOnLight = (hex: string, lightBgHex = '#ffffff', minRatio = 4.5): string => {
  if (!hex) return hex;
  let c = hex;
  if (contrastRatio(c, lightBgHex) >= minRatio) return c;
  // Try progressively darkening up to 90%
  for (let f = 0.1; f <= 0.9; f += 0.05) {
    const candidate = darken(hex, f);
    if (contrastRatio(candidate, lightBgHex) >= minRatio) return candidate;
  }
  return '#111111'; // ultimate fallback to satisfy contrast on white
};

export const mixColors = (colors: string[]) => {
  if (!colors.length) return '#000000';
  if (colors.length === 1) return colors[0];
  let color = mixTwoColorsAverage(colors[0], colors[1]);
  if (colors.length === 2) return color;
  for (let i = 2; i < colors.length; i += 1) {
    color = mixTwoColorsAverage(color, colors[i]);
  }
  return color;
}

const mixTwoColorsAverage = (color1: string, color2: string) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (rgb1 && rgb2) {
    const mixRGB = {
      r: Math.round(rgb1.r + rgb2.r / 2),
      g: Math.round(rgb1.g + rgb2.g / 2),
      b: Math.round(rgb1.b + rgb2.b / 2),
    }
    return rgbToHex(mixRGB.r, mixRGB.g, mixRGB.b);
  }
  return '#000000';
}


export const fixWikiImageURL = (url: string) => {
  if (url.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    const filename = url.substring(url.lastIndexOf('/') + 1);
    return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + filename;
  }
  return url;
}
