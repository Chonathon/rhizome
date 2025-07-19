import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  Artist,
  BasicNode,
  Genre,
  GenreClusterMode,
  GenreGraphData,
  LastFMArtistJSON,
  LastFMSearchArtistData,
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
    links.push({ source: artists[0].id, target: artists[i].id });
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

export const clusterColors = [
  "#e06c75",
  "#98c379",
  "#d19a66",
  "#56b6c2",
  "#be5046",
  "#a9a1e1",
];