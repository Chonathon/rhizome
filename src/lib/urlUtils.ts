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

/**
 * Parsed URL state from search params
 */
export interface ParsedUrlState {
  genreSlug: string | null;
  artistSlug: string | null;
}

/**
 * Parse URL state from search params
 */
export function parseUrlState(searchParams: URLSearchParams): ParsedUrlState {
  return {
    genreSlug: searchParams.get('genre'),
    artistSlug: searchParams.get('artist'),
  };
}
