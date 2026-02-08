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
  onGenreDeselected?: () => void;
  onArtistDeselected?: () => void;

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
  const skipNextUrlUpdate = useRef(false);
  const lastAppliedUrl = useRef<string>('');
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
    onGenreDeselected,
    onArtistDeselected,
    genresLoaded,
    artistsLoaded,
  } = options;

  // Store current state in refs so URL->State effect can read without depending on them
  const stateRef = useRef({
    graph,
    selectedGenres,
    selectedArtist,
    similarArtistAnchor,
    collectionMode,
    artistFilterGenres,
  });
  stateRef.current = {
    graph,
    selectedGenres,
    selectedArtist,
    similarArtistAnchor,
    collectionMode,
    artistFilterGenres,
  };

  // Parse current URL state
  const urlState = useMemo(() => parseUrlState(searchParams), [searchParams]);

  // Sync URL -> State (ONLY when URL changes via browser navigation)
  useEffect(() => {
    // Wait for genres to be loaded before applying URL state
    if (!genresLoaded) return;

    const urlString = searchParams.toString();

    // Skip if this is the same URL we last applied (prevents loops)
    if (urlString === lastAppliedUrl.current && !isInitialLoad.current) {
      return;
    }

    lastAppliedUrl.current = urlString;

    // Tell State->URL effect to skip the next update since we're driving state from URL
    skipNextUrlUpdate.current = true;

    const currentState = stateRef.current;

    // Apply view/graph type
    if (urlState.view) {
      const newGraph = viewToGraphType(urlState.view);
      if (newGraph !== currentState.graph) {
        setGraph(newGraph);
      }
    }

    // Apply collection mode
    if (urlState.collectionMode !== currentState.collectionMode) {
      setCollectionMode(urlState.collectionMode);
    }

    // Apply genre selection (genres view)
    if (urlState.genreSlug) {
      const genre = findGenreBySlug(urlState.genreSlug);
      if (genre) {
        if (currentState.selectedGenres.length === 0 || currentState.selectedGenres[0].id !== genre.id) {
          setSelectedGenres([genre]);
          onGenreSelected?.(genre);
        }
      }
    } else if (urlState.view === 'genres' && currentState.selectedGenres.length > 0) {
      // URL has no genre slug but we have a selection - clear it
      setSelectedGenres([]);
      onGenreDeselected?.();
    }

    // Apply genre filter (artists view) - multiple genres
    if (urlState.genreSlugs.length > 0) {
      const genres = urlState.genreSlugs
        .map(slug => findGenreBySlug(slug))
        .filter((g): g is Genre => g !== undefined);
      if (genres.length > 0) {
        // Only update if genres actually changed (prevents refetch loops)
        const currentGenreIds = currentState.artistFilterGenres.map(g => g.id).sort().join(',');
        const newGenreIds = genres.map(g => g.id).sort().join(',');
        if (currentGenreIds !== newGenreIds) {
          setArtistFilterGenres(genres);
          // Also set selected genres for display
          if (currentState.selectedGenres.length === 0) {
            setSelectedGenres(genres);
          }
        }
      }
    }

    // Apply artist selection (requires artists data)
    if (urlState.artistSlug) {
      if (artistsLoaded) {
        const artist = findArtistBySlug(urlState.artistSlug);
        if (artist) {
          if (!currentState.selectedArtist || currentState.selectedArtist.id !== artist.id) {
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
    } else if (currentState.selectedArtist) {
      // URL has no artist slug but we have a selection - clear it
      setSelectedArtist(undefined);
      onArtistDeselected?.();
      pendingArtistSlugRef.current = null;
    }

    // Apply similar artist anchor
    if (urlState.anchorSlug) {
      if (artistsLoaded) {
        const anchor = findArtistBySlug(urlState.anchorSlug);
        if (anchor) {
          if (!currentState.similarArtistAnchor || currentState.similarArtistAnchor.id !== anchor.id) {
            setSimilarArtistAnchor(anchor);
          }
        } else {
          pendingAnchorSlugRef.current = urlState.anchorSlug;
        }
      } else {
        pendingAnchorSlugRef.current = urlState.anchorSlug;
      }
    } else if (currentState.similarArtistAnchor) {
      // URL has no anchor slug but we have one - clear it
      setSimilarArtistAnchor(undefined);
      pendingAnchorSlugRef.current = null;
    }

    isInitialLoad.current = false;
  }, [
    searchParams,
    urlState,
    genresLoaded,
    artistsLoaded,
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
    onGenreDeselected,
    onArtistDeselected,
  ]);

  // Sync State -> URL (when state changes from user interaction)
  useEffect(() => {
    // Skip on initial load - let URL drive state first
    if (isInitialLoad.current) return;

    // Skip if we just applied URL state (prevents loops)
    if (skipNextUrlUpdate.current) {
      skipNextUrlUpdate.current = false;
      return;
    }

    const newParams = buildUrlParams({
      graph,
      selectedGenres,
      selectedArtist,
      similarArtistAnchor,
      collectionMode,
      artistFilterGenres,
    });

    // Sort params for consistent comparison
    const sortParams = (params: URLSearchParams): string => {
      const entries = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return new URLSearchParams(entries).toString();
    };

    const newUrlString = sortParams(newParams);
    const currentUrlString = sortParams(searchParams);

    if (newUrlString !== currentUrlString) {
      lastAppliedUrl.current = newParams.toString();
      setSearchParams(newParams, { replace: false });
    }
  }, [
    graph,
    selectedGenres,
    selectedArtist,
    similarArtistAnchor,
    collectionMode,
    artistFilterGenres,
    searchParams,
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
