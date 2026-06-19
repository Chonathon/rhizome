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

/**
 * View mode values that appear in the `?view=` URL param.
 */
export type ViewMode = 'genres' | 'artists' | 'collection' | 'similar-artists';

/**
 * Derive the URL view param value from the current graph tab and collection flag.
 * 'parentGenre' is an internal transient tab — it maps to 'genres' for sharing.
 */
export function graphStateToViewMode(graph: string, collectionMode: boolean): ViewMode {
  if (graph === 'similarArtists') return 'similar-artists';
  if (graph === 'artists' && collectionMode) return 'collection';
  if (graph === 'artists') return 'artists';
  return 'genres';
}

/**
 * Parse a `?view=` param value into graph tab + collection flag.
 * Returns null for unrecognised values (caller should keep current state).
 */
export function viewModeToGraphState(
  viewMode: string | null
): { graph: 'genres' | 'artists' | 'similarArtists'; collectionMode: boolean } | null {
  switch (viewMode) {
    case 'genres': return { graph: 'genres', collectionMode: false };
    case 'artists': return { graph: 'artists', collectionMode: false };
    case 'collection': return { graph: 'artists', collectionMode: true };
    case 'similar-artists': return { graph: 'similarArtists', collectionMode: false };
    default: return null;
  }
}
