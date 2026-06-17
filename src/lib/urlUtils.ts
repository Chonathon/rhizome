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

// The four navigable views. 'genres' is the default and is omitted from the URL.
export type ViewMode = 'genres' | 'artists' | 'collection' | 'similar';

export function isValidViewMode(v: string | null): v is ViewMode {
  return v === 'genres' || v === 'artists' || v === 'collection' || v === 'similar';
}

/**
 * Parsed URL state from search params
 */
export interface ParsedUrlState {
  genreSlug: string | null;
  artistSlug: string | null;
  viewMode: ViewMode | null;
  anchorId: string | null;
}

/**
 * Parse URL state from search params
 */
export function parseUrlState(searchParams: URLSearchParams): ParsedUrlState {
  const view = searchParams.get('view');
  return {
    genreSlug: searchParams.get('genre'),
    artistSlug: searchParams.get('artist'),
    viewMode: isValidViewMode(view) ? view : null,
    anchorId: searchParams.get('anchor'),
  };
}
