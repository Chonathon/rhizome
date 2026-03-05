/**
 * useUrlState - Bidirectional sync between React state and URL query parameters
 *
 * ADDING A NEW URL PARAMETER:
 *
 * 1. urlUtils.ts - Add to parse/build functions:
 *    // parseUrlState: extract from URL
 *    const newParam = searchParams.get('newParam');
 *
 *    // buildUrlParams: add to URL
 *    if (state.newThing) {
 *      params.set('newParam', state.newThing);
 *    }
 *
 * 2. useUrlState.ts - Add to options interface + sync logic:
 *    // Interface: add state + setter
 *    newThing: string | undefined;
 *    setNewThing: (val: string | undefined) => void;
 *
 *    // URL→State effect: apply from URL
 *    if (urlState.newParam !== currentState.newThing) {
 *      setNewThing(urlState.newParam);
 *    }
 *
 * 3. App.tsx - Pass the new state/setter to the hook (~2 lines)
 *
 * TIP: Only sync state that's meaningful to share/bookmark.
 * Display preferences (node size, etc.) are fine in localStorage.
 */

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
  // Guards against race condition: State→URL sets lastAppliedUrl to the NEW url
  // and calls setSearchParams, but before the browser updates searchParams,
  // URL→State can fire and see stale searchParams mismatching lastAppliedUrl.
  // This ref tells URL→State to skip while a State→URL push is in-flight.
  const pendingStateToUrlUpdate = useRef(false);

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

  // Store callbacks in refs so URL->State effect can call them without depending on their identity
  const callbacksRef = useRef({
    onGenreSelected,
    onArtistSelected,
    onGenreDeselected,
    onArtistDeselected,
  });
  callbacksRef.current = {
    onGenreSelected,
    onArtistSelected,
    onGenreDeselected,
    onArtistDeselected,
  };

  // Parse current URL state
  const urlState = useMemo(() => parseUrlState(searchParams), [searchParams]);

  // Sync URL -> State (ONLY when URL changes via browser navigation)
  useEffect(() => {
    // Wait for genres to be loaded before applying URL state
    if (!genresLoaded) return;

    const urlString = searchParams.toString();

    console.log('[useUrlState] URL→State effect fired', { urlString, lastApplied: lastAppliedUrl.current, isInitial: isInitialLoad.current, pendingPush: pendingStateToUrlUpdate.current });

    // Skip if State→URL just pushed a new URL and the browser hasn't caught up yet
    if (pendingStateToUrlUpdate.current) {
      if (urlString === lastAppliedUrl.current) {
        // Browser caught up to the URL we pushed — clear the flag, skip processing
        // (this URL was set by us, not by browser navigation)
        console.log('[useUrlState] URL→State SKIPPED (browser caught up to our push)');
        pendingStateToUrlUpdate.current = false;
        return;
      }
      // Browser hasn't caught up yet — skip processing stale URL
      console.log('[useUrlState] URL→State SKIPPED (waiting for browser to catch up)');
      return;
    }

    // Skip if this is the same URL we last applied (prevents loops)
    if (urlString === lastAppliedUrl.current && !isInitialLoad.current) {
      console.log('[useUrlState] URL→State SKIPPED (guard matched)');
      return;
    }
    console.log('[useUrlState] URL→State PROCEEDING past guard');

    lastAppliedUrl.current = urlString;

    // Tell State->URL effect to skip the next update since we're driving state from URL
    // Only skip if URL actually has params — on base URL (no params), we don't want
    // to block the first user interaction from generating a URL
    if (urlString) {
      skipNextUrlUpdate.current = true;
    }

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
          console.log('[useUrlState] Calling onGenreSelected for:', genre.name);
          callbacksRef.current.onGenreSelected?.(genre);
        }
      }
    } else if (urlState.view === 'genres' && currentState.selectedGenres.length > 0) {
      // URL has no genre slug but we have a selection - clear it
      setSelectedGenres([]);
      console.log('[useUrlState] Calling onGenreDeselected');
      callbacksRef.current.onGenreDeselected?.();
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
            console.log('[useUrlState] Calling onArtistSelected for:', artist.name);
            callbacksRef.current.onArtistSelected?.(artist);
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
      console.log('[useUrlState] Calling onArtistDeselected');
      callbacksRef.current.onArtistDeselected?.();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      pendingStateToUrlUpdate.current = true;
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
