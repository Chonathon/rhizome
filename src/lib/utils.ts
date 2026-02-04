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
import {
  PARENT_FIELD_MAP,
  CHILD_FIELD_MAP,
  getClusterColor,
  SINGLETON_PARENT_GENRE,
  SINGLETON_PARENT_COLOR, SERVER_PRODUCTION_URL, CLIENT_DEPLOYMENT_URL, SERVER_DEVELOPMENT_URL
} from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // Take the locale of the user into effect to avoid discrepancies
  const offset = date.getTimezoneOffset();
  date.setTime(date.getTime() + offset * 60 * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

export const formatNumberCompact = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);

export const envBoolean = (value: string) => {
  return value && (value.toLowerCase() === 'true' || parseInt(value) === 1);
}

export const serverUrl = () => {
  if (envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)) {
    return envBoolean(import.meta.env.VITE_FORWARD_FROM_NGROK) ? import.meta.env.VITE_LOCALHOST_NGROK : import.meta.env.VITE_LOCALHOST;
  }
  if (envBoolean(import.meta.env.VITE_USE_LOCAL_CLIENT) || envBoolean(import.meta.env.VITE_IS_VERCEL_PREVIEW)) {
    return import.meta.env.VITE_SERVER_DEV_URL || (import.meta.env.DEV ? '/api' : SERVER_DEVELOPMENT_URL);
  }
  return import.meta.env.VITE_SERVER_PROD_URL || (import.meta.env.DEV ? '/api' : SERVER_PRODUCTION_URL);
}

export const clientUrl = () => {
  return envBoolean(import.meta.env.VITE_USE_LOCAL_CLIENT)
      ? import.meta.env.VITE_CLIENT_LOCALHOST
      : import.meta.env.IS_VERCEL_PREVIEW
          ? window.location.href.replace(/\/$/, '')
          : (import.meta.env.VITE_CLIENT_URL || CLIENT_DEPLOYMENT_URL);
}

export const isOnPage = (pathname: string) => {
  return window.location.pathname.toLowerCase().includes(pathname.toLowerCase());
}

export const primitiveArraysEqual = (a: Array<string | number>, b: Array<string | number>) => {
  a.sort();
  b.sort();

  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

export const arraySubsetOf = (a: Array<string | number>, b: Array<string | number>) => {
  return b.every(v => a.includes(v));
}

// Wait on a function to return true
export const until = (get: () => boolean, interval = 200, abort = 15000) => {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (get()) return resolve();
      if (Date.now() - start > abort) return reject(new Error('until timeout'));
      setTimeout(tick, interval);
    };
    tick();
  });
};

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

export const isRootGenre = (genre: Genre, genreClusterModes: GenreClusterMode[]) => {
  let isRoot = false;
  genreClusterModes.forEach((mode: GenreClusterMode) => {
    if (genre[PARENT_FIELD_MAP[mode]].length > 0 && genre[CHILD_FIELD_MAP[mode]].length === 0) isRoot = true;
  });
  return isRoot;
}

export const isSingletonGenre = (genre: Genre, genreClusterModes: GenreClusterMode[]) => {
  let isSingleton = true;
  genreClusterModes.forEach((mode: GenreClusterMode) => {
    if (genre[PARENT_FIELD_MAP[mode]].length > 0 || genre[CHILD_FIELD_MAP[mode]].length > 0) {
      isSingleton = false;
    }
  });
  return isSingleton;
}

export const getChildrenOfGenre = (genre: Genre, genres: Genre[], modes: GenreClusterMode[]) => {
  const allChildren: Genre[] = [];
  const genresMap = new Map<string, Genre>(genres.map(g => [g.id, g]));
  const visited = new Set<string>();
  const addChildren = (parentId: string, level: number) => {
    const genre = genresMap.get(parentId);
    if (!genre || visited.has(parentId)) return;

    visited.add(parentId);
    let children: {id: string, name: string, mode: GenreClusterMode}[] = [];
    modes.forEach((mode) => {
      children.push(...genre[PARENT_FIELD_MAP[mode]].map(g => {
        return {...g, mode};
      }))
    });

    for (const child of children) {
      const childId = child.id;
      const childGenre = genresMap.get(childId);
      if (childGenre) {
        allChildren.push({ id: childId, name: child.name } as Genre);
      }
      addChildren(childId, level + 1);
    }
  };
  addChildren(genre.id, 1);
  return allChildren;
}

export const getParentChildrenMap = (topLevelGenres: Genre[], genres: Genre[], modes: GenreClusterMode[]) => {
  const parentChildrenMap = new Map<string, Genre[]>();
  topLevelGenres.forEach((topLevelGenre) => {
    const children = getChildrenOfGenre(topLevelGenre, genres, modes);
    if (children && children.length > 0) {
      parentChildrenMap.set(topLevelGenre.id, children);
    }
  });
  return parentChildrenMap;
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
      children.push(...genre[PARENT_FIELD_MAP[mode]].map(g => {
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
      children.push(...genre[PARENT_FIELD_MAP[mode]].map(g => {
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

export const assignRootGenreColors = (rootIDs: string[]) => {
  const colorMap = new Map<string, string>();
  colorMap.set(SINGLETON_PARENT_GENRE.id, SINGLETON_PARENT_COLOR);
  if (!rootIDs.length) return colorMap;
  const sortedRoots = [...rootIDs].sort((a, b) => a.localeCompare(b));
  sortedRoots.forEach((n, i) => {
    colorMap.set(n, getClusterColor(i));
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
  return getClusterColor(count);
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

export const getRootGenreOfChild = (genre: Genre, genres: Genre[], genreClusterModes: GenreClusterMode[]) => {
  if (isRootGenre(genre, genreClusterModes)) return genre;
  let singleton = true;
  genreClusterModes.forEach(c => {
    if (genre[CHILD_FIELD_MAP[c]].length) singleton = false;
  });
  if (singleton) return SINGLETON_PARENT_GENRE;
  const genresMap = new Map<string, Genre>(genres.map(g => [g.id, g]));
  const addParent = (childID: string, level: number) => {
    const genre = genresMap.get(childID);
    if (!genre) return;
    let parents: {id: string, name: string, mode: GenreClusterMode}[] = [];
    genreClusterModes.forEach((mode) => {
      parents.push(...genre[CHILD_FIELD_MAP[mode]].map(g => {
        return {...g, mode};
      }))
    });
  }
}

export const appendYoutubeWatchURL = (ytID: string) => {
  return `https://www.youtube.com/watch?v=${ytID}`;
}

export const assignDegreesToArtists = (currentArtists: Artist[], likedArtists: string[]) => {
  if (!currentArtists || !likedArtists) return [];
  // Index artists for quick membership checks
  const artistSet = new Set(currentArtists.map((artist) => artist.id));
  // Map names to IDs because the Last.fm similar artists are only the artist's name.
  // This could run into issues with artists of the same name in current artists
  const artistNameIDMap = new Map<string, string>(currentArtists.map(a => [a.name, a.id]));
  //console.log(artistSet.size)
  // Undirected adjacency graph of artists/links (i.e. ensures edges are both ways)
  const artistAdj = new Map<string, string[]>();
  for (const artist of currentArtists) {
    if (!artistAdj.has(artist.id)) artistAdj.set(artist.id, []);
    const linksList = artistAdj.get(artist.id)!;

    for (const link of artist.similar) {
      const linkedID = artistNameIDMap.get(link);
      if (linkedID) {
        linksList.push(linkedID);
        if (!artistAdj.has(linkedID)) artistAdj.set(linkedID, [artist.id]);
      }
    }
    artistAdj.set(artist.id, linksList);
  }

  //console.log(artistAdj.values().filter(v => v.length))

  // Map of artist IDs to degrees
  const artistDegrees = new Map<string, number>();

  const visited: string[] = [];

  // Only use nodes from B that are in A; set those nodes as degree 0
  for (const liked of likedArtists) {
    if (artistSet.has(liked) && !artistDegrees.has(liked)) {
      artistDegrees.set(liked, 0);
      visited.push(liked);
    }
  }

  // BFS to calculate the degrees (expanding for loop based on visited)
  for (let vi = 0; vi < visited.length; vi++) {
    const likedInAB = visited[vi];
    const degree = artistDegrees.get(likedInAB)!;
    const neighbors = artistAdj.get(likedInAB) || [];
    for (const neighbor of neighbors) {
      if (!artistDegrees.has(neighbor)) {
        artistDegrees.set(neighbor, degree + 1);
        visited.push(neighbor);
      }
    }
  }

  //console.log(artistDegrees)

  return currentArtists.map(a => {
    return {...a, degree: artistDegrees.get(a.id)}
  });
}

export const parseAppAccess = (appAccess: string) => {
  const [phase, version] = appAccess.split('-');
  return { phase, version };
}
