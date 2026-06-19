import { useCallback, useEffect, useRef, useState } from 'react';
import { toSlug, graphStateToViewMode, viewModeToGraphState } from '@/lib/urlUtils';
import type { Artist, Genre } from '@/types';

interface UseUrlStateOptions {
  findGenreBySlug: (slug: string) => Genre | undefined;
  fetchArtistById: (id: string) => Promise<Artist | undefined>;
  onGenreFromUrl?: (genre: Genre) => void;
  onArtistFromUrl?: (artist: Artist) => void;
  onGenreClearedFromUrl?: () => void;
  onArtistClearedFromUrl?: () => void;
  onViewFromUrl?: (graph: 'genres' | 'artists' | 'similarArtists', collectionMode: boolean) => void;
  genresLoaded: boolean;
}

/**
 * The entity passed to `updateUrl` to sync drawer state to the URL.
 * - Artist: use `id` (database ID) — guarantees accurate restoration when artists share a name.
 * - Genre: use `name` — slugified for the URL param.
 * - `null`: clears both params (drawer dismissed).
 */
export type UrlEntity =
  | { type: 'genre'; name: string }
  | { type: 'artist'; id: string; name: string }
  | null;

export interface UrlStateResult {
  updateUrl: (entity: UrlEntity) => void;
  updateView: (graph: string, collectionMode: boolean) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}

/**
 * historyIndex is stored in window.history.state so it survives page refreshes.
 * On refresh, the browser restores the current history entry's state, so we can
 * read the index back from there.
 */
const getStoredHistoryIndex = (): number =>
  window.history.state?.historyIndex ?? 0;

/**
 * Syncs artist/genre drawer state to the URL via `window.history.pushState`.
 * Handles initial page load and browser back/forward (popstate).
 *
 * Call `updateUrl` in any handler that opens or closes a drawer:
 * ```ts
 * // Opening an artist drawer — always include id and name
 * updateUrl({ type: 'artist', id: artist.id, name: artist.name });
 *
 * // Opening a genre drawer
 * updateUrl({ type: 'genre', name: genre.name });
 *
 * // Closing (dismiss / clear)
 * updateUrl(null);
 * ```
 *
 * Rule of thumb: if a handler calls `setShowArtistCard(true)` or
 * `setShowGenreCard(true)`, it needs a matching `updateUrl` call.
 *
 * `goBack` / `goForward` navigate the app's own URL history.
 * `canGoBack` / `canGoForward` reflect whether navigation is possible.
 */
export function useUrlState(options: UseUrlStateOptions): UrlStateResult {
  const prevGenreSlug = useRef<string | null>(null);
  const prevArtistSlug = useRef<string | null>(null);
  const initialLoadProcessed = useRef(false);

  // historyIndex is seeded from window.history.state on every mount (survives refresh).
  // forwardCount cannot be reliably restored after a refresh — reset to 0.
  const historyIndex = useRef(getStoredHistoryIndex());
  const forwardCount = useRef(0);
  const [canGoBack, setCanGoBack] = useState(() => historyIndex.current > 0);
  const [canGoForward, setCanGoForward] = useState(false);

  const { genresLoaded } = options;

  // Store all options in a ref so effects/listeners always see latest values
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const prevViewParam = useRef<string | null>(null);

  // Shared logic: resolve URL slugs → open/close drawers and restore view
  const processUrlParams = useCallback((genreSlug: string | null, artistSlug: string | null, viewParam: string | null) => {
    if (genreSlug !== prevGenreSlug.current) {
      prevGenreSlug.current = genreSlug;
      if (genreSlug) {
        const genre = callbacksRef.current.findGenreBySlug(genreSlug);
        if (genre) callbacksRef.current.onGenreFromUrl?.(genre);
      } else {
        callbacksRef.current.onGenreClearedFromUrl?.();
      }
    }

    if (artistSlug !== prevArtistSlug.current) {
      prevArtistSlug.current = artistSlug;
      if (artistSlug) {
        callbacksRef.current.fetchArtistById(artistSlug).then((artist) => {
          if (artist) callbacksRef.current.onArtistFromUrl?.(artist);
        });
      } else {
        callbacksRef.current.onArtistClearedFromUrl?.();
      }
    }

    if (viewParam !== prevViewParam.current) {
      prevViewParam.current = viewParam;
      const viewState = viewModeToGraphState(viewParam);
      if (viewState) {
        callbacksRef.current.onViewFromUrl?.(viewState.graph, viewState.collectionMode);
      }
    }
  }, []);

  // Initial load: process URL params once genres are ready
  useEffect(() => {
    if (!genresLoaded || initialLoadProcessed.current) return;
    initialLoadProcessed.current = true;
    const params = new URLSearchParams(window.location.search);
    processUrlParams(params.get('genre'), params.get('artist'), params.get('view'));
  }, [genresLoaded, processUrlParams]);

  // Browser back/forward: popstate listener reads directly from window.location.
  // Also syncs historyIndex from event.state so native nav keeps canGoBack/canGoForward accurate.
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!callbacksRef.current.genresLoaded) return;

      const params = new URLSearchParams(window.location.search);
      processUrlParams(params.get('genre'), params.get('artist'), params.get('view'));

      // Sync history index from the restored history entry's state.
      const newIndex: number = event.state?.historyIndex ?? 0;
      const prevIndex = historyIndex.current;

      if (newIndex < prevIndex) {
        // navigated back — accumulate forward entries
        forwardCount.current += prevIndex - newIndex;
      } else if (newIndex > prevIndex) {
        // navigated forward — consume forward entries
        forwardCount.current = Math.max(0, forwardCount.current - (newIndex - prevIndex));
      }

      historyIndex.current = newIndex;
      setCanGoBack(newIndex > 0);
      setCanGoForward(forwardCount.current > 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [processUrlParams]);

  // App → URL: pushState with historyIndex embedded in state so it survives refresh.
  const updateUrl = useCallback((entity: UrlEntity) => {
    const params = new URLSearchParams(window.location.search);

    if (entity === null) {
      params.delete('genre');
      params.delete('artist');
    } else if (entity.type === 'genre') {
      params.set('genre', toSlug(entity.name));
      params.delete('artist');
    } else {
      params.set('artist', entity.id);
      params.delete('genre');
    }

    prevGenreSlug.current = params.get('genre');
    prevArtistSlug.current = params.get('artist');

    const search = params.toString();
    const newUrl = search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname;

    const newIndex = historyIndex.current + 1;
    window.history.pushState({ historyIndex: newIndex }, '', newUrl);

    historyIndex.current = newIndex;
    forwardCount.current = 0;
    setCanGoBack(true);
    setCanGoForward(false);
  }, []);

  const goBack = useCallback(() => {
    if (historyIndex.current <= 0) return;
    window.history.back();
    // Optimistically update for immediate UI feedback; popstate will confirm.
    const newIndex = historyIndex.current - 1;
    historyIndex.current = newIndex;
    forwardCount.current++;
    setCanGoBack(newIndex > 0);
    setCanGoForward(true);
  }, []);

  const goForward = useCallback(() => {
    if (forwardCount.current <= 0) return;
    window.history.forward();
    // Optimistically update for immediate UI feedback; popstate will confirm.
    historyIndex.current++;
    forwardCount.current--;
    setCanGoBack(true);
    setCanGoForward(forwardCount.current > 0);
  }, []);

  // Update just the `view` param in place using replaceState (no history entry).
  // updateUrl (pushState) naturally preserves this param since it reads the current URL first.
  const updateView = useCallback((graph: string, collectionMode: boolean) => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', graphStateToViewMode(graph, collectionMode));
    const search = params.toString();
    const newUrl = search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname;
    window.history.replaceState(window.history.state, '', newUrl);
    prevViewParam.current = params.get('view');
  }, []);

  return { updateUrl, updateView, canGoBack, canGoForward, goBack, goForward };
}
