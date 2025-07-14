import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {Artist, BasicNode, Genre, GenreClusterMode, LastFMArtistJSON, LastFMSearchArtistData, NodeLink} from "@/types";

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

export const isParentGenre = (genre: Genre, genreClusterMode: GenreClusterMode) => {
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