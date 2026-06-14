/**
 * Convert a name to a URL-safe slug
 * "Hip Hop" -> "hip-hop"
 * "Rock & Roll" -> "rock-and-roll"
 */
export function toSlug(name: string | undefined | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

import type { UrlView } from '@/types';

/**
 * Parsed URL state from search params
 */
export interface ParsedUrlState {
  genreSlug: string | null;
  artistSlug: string | null;
  view: UrlView | null;
  collectionMode: boolean;
  anchorSlug: string | null;
}

/**
 * Parse URL state from search params
 */
export function parseUrlState(searchParams: URLSearchParams): ParsedUrlState {
  const rawView = searchParams.get('view');
  const view: UrlView | null =
    rawView === 'genres' || rawView === 'artists' || rawView === 'similar'
      ? rawView
      : null;
  return {
    genreSlug: searchParams.get('genre'),
    artistSlug: searchParams.get('artist'),
    view,
    collectionMode: searchParams.get('collection') === 'true',
    anchorSlug: searchParams.get('anchor'),
  };
}
