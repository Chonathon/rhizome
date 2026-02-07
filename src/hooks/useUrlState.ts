import { useSearchParams } from 'react-router';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import {
  parseUrlState,
  buildUrlParams,
  toSlug,
  viewToGraphType,
  type ParsedUrlState,
} from '@/lib/urlUtils';
import type { Artist, Genre, GraphType } from '@/types';

interface UseUrlStateOptions {
  // Lookup functions to resolve slugs to entities
  findGenreBySlug: (slug: string) => Genre | undefined;
  findArtistBySlug: (slug: string) => Artist | undefined;

  // Current app state
  graph: GraphType;
  selectedGenres: Genre[];
  selectedArtist: Artist | undefined;
  similarArtistAnchor: Artist | undefined;
  collectionMode: boolean;
  artistFilterGenres: Genre[];

  // State setters (called when URL changes)
  setGraph: (graph: GraphType) => void;
  setSelectedGenres: (genres: Genre[]) => void;
  setSelectedArtist: (artist: Artist | undefined) => void;
  setSimilarArtistAnchor: (artist: Artist | undefined) => void;
  setCollectionMode: (mode: boolean) => void;
  setArtistFilterGenres: (genres: Genre[]) => void;

  // Optional callbacks for side effects
  onGenreSelected?: (genre: Genre) => void;
  onArtistSelected?: (artist: Artist) => void;

  // Data availability flags
  genresLoaded: boolean;
  artistsLoaded: boolean;
}

export interface UrlStateResult {
  urlState: ParsedUrlState;
  isInitialLoad: boolean;
  pendingArtistSlug: string | null;
  pendingAnchorSlug: string | null;
  setPendingArtistSlug: (slug: string | null) => void;
  setPendingAnchorSlug: (slug: string | null) => void;
}

export function useUrlState(options: UseUrlStateOptions): UrlStateResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialLoad = useRef(true);
  const isUpdatingFromUrl = useRef(false);
  const lastUrlState = useRef<string>('');
  const pendingArtistSlugRef = useRef<string | null>(null);
  const pendingAnchorSlugRef = useRef<string | null>(null);

  const {
    findGenreBySlug,
    findArtistBySlug,
    graph,
    selectedGenres,
    selectedArtist,
    similarArtistAnchor,
    collectionMode,
    artistFilterGenres,
    setGraph,
    setSelectedGenres,
    setSelectedArtist,
    setSimilarArtistAnchor,
    setCollectionMode,
    setArtistFilterGenres,
    onGenreSelected,
    onArtistSelected,
    genresLoaded,
    artistsLoaded,
  } = options;

  // Parse current URL state
  const urlState = useMemo(() => parseUrlState(searchParams), [searchParams]);

  // Sync URL -> State (on initial load or when URL changes via browser navigation)
  useEffect(() => {
    // Wait for genres to be loaded before applying URL state
    if (!genresLoaded) return;

    const urlString = searchParams.toString();
    // Skip if URL hasn't changed (prevents loops)
    if (urlString === lastUrlState.current && !isInitialLoad.current) return;

    isUpdatingFromUrl.current = true;
    lastUrlState.current = urlString;

    try {
      // Apply view/graph type
      if (urlState.view) {
        const newGraph = viewToGraphType(urlState.view);
        if (newGraph !== graph) {
          setGraph(newGraph);
        }
      }

      // Apply collection mode
      if (urlState.collectionMode !== collectionMode) {
        setCollectionMode(urlState.collectionMode);
      }

      // Apply genre selection (genres view)
      if (urlState.genreSlug) {
        const genre = findGenreBySlug(urlState.genreSlug);
        if (genre) {
          if (selectedGenres.length === 0 || selectedGenres[0].id !== genre.id) {
            setSelectedGenres([genre]);
            onGenreSelected?.(genre);
          }
        }
      }

      // Apply genre filter (artists view) - multiple genres
      if (urlState.genreSlugs.length > 0) {
        const genres = urlState.genreSlugs
          .map(slug => findGenreBySlug(slug))
          .filter((g): g is Genre => g !== undefined);
        if (genres.length > 0) {
          setArtistFilterGenres(genres);
          // Also set selected genres for display
          if (selectedGenres.length === 0) {
            setSelectedGenres(genres);
          }
        }
      }

      // Apply artist selection (requires artists data)
      if (urlState.artistSlug) {
        if (artistsLoaded) {
          const artist = findArtistBySlug(urlState.artistSlug);
          if (artist) {
            if (!selectedArtist || selectedArtist.id !== artist.id) {
              setSelectedArtist(artist);
              onArtistSelected?.(artist);
            }
          } else {
            // Artist not found yet, store as pending
            pendingArtistSlugRef.current = urlState.artistSlug;
          }
        } else {
          // Artists not loaded yet, store as pending
          pendingArtistSlugRef.current = urlState.artistSlug;
        }
      }

      // Apply similar artist anchor
      if (urlState.anchorSlug) {
        if (artistsLoaded) {
          const anchor = findArtistBySlug(urlState.anchorSlug);
          if (anchor) {
            if (!similarArtistAnchor || similarArtistAnchor.id !== anchor.id) {
              setSimilarArtistAnchor(anchor);
            }
          } else {
            pendingAnchorSlugRef.current = urlState.anchorSlug;
          }
        } else {
          pendingAnchorSlugRef.current = urlState.anchorSlug;
        }
      }
    } finally {
      isUpdatingFromUrl.current = false;
      isInitialLoad.current = false;
    }
  }, [
    searchParams,
    genresLoaded,
    artistsLoaded,
    urlState,
    graph,
    collectionMode,
    selectedGenres,
    selectedArtist,
    similarArtistAnchor,
    findGenreBySlug,
    findArtistBySlug,
    setGraph,
    setSelectedGenres,
    setSelectedArtist,
    setSimilarArtistAnchor,
    setCollectionMode,
    setArtistFilterGenres,
    onGenreSelected,
    onArtistSelected,
  ]);

  // Sync State -> URL (when state changes from user interaction)
  useEffect(() => {
    // Skip if we're currently applying URL state to avoid loops
    if (isUpdatingFromUrl.current) return;
    // Skip on initial load - let URL drive state first
    if (isInitialLoad.current) return;

    const newParams = buildUrlParams({
      graph,
      selectedGenres,
      selectedArtist,
      similarArtistAnchor,
      collectionMode,
      artistFilterGenres,
    });

    const newUrlString = newParams.toString();
    if (newUrlString !== lastUrlState.current) {
      lastUrlState.current = newUrlString;
      // Use replace: false to create history entries for back/forward navigation
      setSearchParams(newParams, { replace: false });
    }
  }, [
    graph,
    selectedGenres,
    selectedArtist,
    similarArtistAnchor,
    collectionMode,
    artistFilterGenres,
    setSearchParams,
  ]);

  // Helper to set pending slugs from outside
  const setPendingArtistSlug = useCallback((slug: string | null) => {
    pendingArtistSlugRef.current = slug;
  }, []);

  const setPendingAnchorSlug = useCallback((slug: string | null) => {
    pendingAnchorSlugRef.current = slug;
  }, []);

  return {
    urlState,
    isInitialLoad: isInitialLoad.current,
    pendingArtistSlug: pendingArtistSlugRef.current,
    pendingAnchorSlug: pendingAnchorSlugRef.current,
    setPendingArtistSlug,
    setPendingAnchorSlug,
  };
}
