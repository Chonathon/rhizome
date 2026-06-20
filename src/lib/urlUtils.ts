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
 * The active view/mode in the app, encoded as the `view` URL param.
 * Omitting the param (or any unrecognized value) defaults to 'genres'.
 */
export type AppView = 'genres' | 'artists' | 'collection' | 'similar';

const VALID_VIEWS: ReadonlySet<string> = new Set(['genres', 'artists', 'collection', 'similar']);

export function parseAppView(raw: string | null): AppView | null {
  if (raw && VALID_VIEWS.has(raw)) return raw as AppView;
  return null;
}

/**
 * Parsed URL state from search params
 */
export interface ParsedUrlState {
  genreSlug: string | null;
  artistSlug: string | null;
  view: AppView | null;
}

/**
 * Parse URL state from search params
 */
export function parseUrlState(searchParams: URLSearchParams): ParsedUrlState {
  return {
    genreSlug: searchParams.get('genre'),
    artistSlug: searchParams.get('artist'),
    view: parseAppView(searchParams.get('view')),
  };
}
