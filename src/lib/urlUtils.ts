import type { Artist, Genre, GraphType } from "@/types";

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
  view: 'genres' | 'artists' | 'similar' | null;
  genreSlug: string | null;
  genreSlugs: string[];
  artistSlug: string | null;
  anchorSlug: string | null;
  collectionMode: boolean;
}

/**
 * Parse URL state from search params
 */
export function parseUrlState(searchParams: URLSearchParams): ParsedUrlState {
  const view = searchParams.get('view');
  const genreSlug = searchParams.get('genre');
  const genreSlugsParam = searchParams.get('genres');
  const artistSlug = searchParams.get('artist');
  const anchorSlug = searchParams.get('anchor');
  const mode = searchParams.get('mode');

  return {
    view: ['genres', 'artists', 'similar'].includes(view || '')
      ? (view as ParsedUrlState['view'])
      : null,
    genreSlug,
    genreSlugs: genreSlugsParam ? genreSlugsParam.split(',').filter(Boolean) : [],
    artistSlug,
    anchorSlug,
    collectionMode: mode === 'collection',
  };
}

/**
 * Input state for building URL params
 */
export interface UrlStateInput {
  graph: GraphType;
  selectedGenres: Genre[];
  selectedArtist: Artist | undefined;
  similarArtistAnchor: Artist | undefined;
  collectionMode: boolean;
  artistFilterGenres: Genre[];
}

/**
 * Build URL search params from app state
 */
export function buildUrlParams(state: UrlStateInput): URLSearchParams {
  const params = new URLSearchParams();

  // Map GraphType to URL view
  const viewMap: Record<string, string> = {
    genres: 'genres',
    artists: 'artists',
    similarArtists: 'similar',
    parentGenre: 'genres', // fallback to genres view
  };

  const view = viewMap[state.graph] || 'genres';
  params.set('view', view);

  // Genre selection (for genres view)
  if (state.graph === 'genres' && state.selectedGenres.length > 0) {
    params.set('genre', toSlug(state.selectedGenres[0].name));
  }

  // Genre filter (for artists/similar views)
  if ((state.graph === 'artists' || state.graph === 'similarArtists')
      && state.artistFilterGenres.length > 0) {
    const slugs = state.artistFilterGenres
      .map(g => toSlug(g?.name))
      .filter(Boolean);
    if (slugs.length > 0) {
      params.set('genres', slugs.join(','));
    }
  }

  // Artist selection
  if (state.selectedArtist) {
    params.set('artist', toSlug(state.selectedArtist.name));
  }

  // Similar artist anchor
  if (state.graph === 'similarArtists' && state.similarArtistAnchor) {
    params.set('anchor', toSlug(state.similarArtistAnchor.name));
  }

  // Collection mode
  if (state.collectionMode) {
    params.set('mode', 'collection');
  }

  return params;
}

/**
 * Map URL view param to GraphType
 */
export function viewToGraphType(view: ParsedUrlState['view']): GraphType {
  const map: Record<string, GraphType> = {
    genres: 'genres',
    artists: 'artists',
    similar: 'similarArtists',
  };
  return map[view || ''] || 'genres';
}
