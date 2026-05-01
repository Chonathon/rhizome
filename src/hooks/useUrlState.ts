import { useCallback, useEffect, useRef, useState } from 'react';
import { toSlug } from '@/lib/urlUtils';
import type { Artist, Genre, UrlView } from '@/types';

interface NavUpdate {
  view?: UrlView | null;
  anchor?: string | null;
}

interface UseUrlStateOptions {
  findGenreBySlug: (slug: string) => Genre | undefined;
  fetchArtistById: (id: string) => Promise<Artist | undefined>;
  onGenreFromUrl?: (genre: Genre) => void;
  onArtistFromUrl?: (artist: Artist) => void;
  onGenreClearedFromUrl?: () => void;
  onArtistClearedFromUrl?: () => void;
  onViewFromUrl?: (view: 'genres' | 'artists') => void;
  onAnchorFromUrl?: (artist: Artist) => void;
  onAnchorClearedFromUrl?: () => void;
  getInitialView?: () => UrlView | null;
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
  updateUrl: (entity: UrlEntity, nav?: NavUpdate) => void;
  updateNavUrl: (view: UrlView | null, anchor?: string | null) => void;
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
 * Syncs drawer state and core navigation (view tab, similar-artists anchor) to
 * the URL via `window.history.pushState`. Handles initial page load and browser
 * back/forward (popstate).
 *
 * URL params managed:
 *   ?genre=<slug>   — genre info drawer
 *   ?artist=<id>    — artist info drawer
 *   ?view=<view>    — active tab: 'genres' | 'artists' | 'similar'
 *   ?anchor=<id>    — similar-artists anchor artist ID
 *
 * Call `updateUrl` when opening/closing a drawer:
 * ```ts
 * updateUrl({ type: 'artist', id: artist.id, name: artist.name });
 * updateUrl({ type: 'genre', name: genre.name });
 * updateUrl(null); // dismiss
 * // Optionally update nav in the same push:
 * updateUrl({ type: 'artist', ... }, { view: 'similar', anchor: artist.id });
 * ```
 *
 * Call `updateNavUrl` for tab switches and similar-artists entry/exit:
 * ```ts
 * updateNavUrl('artists');              // switch to artists tab
 * updateNavUrl('similar', artist.id);  // enter similar-artists view
 * updateNavUrl('genres', null);        // back to genres, clear anchor
 * ```
 */
export function useUrlState(options: UseUrlStateOptions): UrlStateResult {
  const prevGenreSlug = useRef<string | null>(null);
  const prevArtistSlug = useRef<string | null>(null);
  const prevView = useRef<string | null>(null);
  const prevAnchorId = useRef<string | null>(null);
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

  // Shared logic: resolve URL slugs → open/close drawers and restore nav state
  const processUrlParams = useCallback((
    genreSlug: string | null,
    artistSlug: string | null,
    view: string | null,
    anchorId: string | null,
  ) => {
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

    // Normalize view: only 'genres' and 'artists' trigger onViewFromUrl.
    // 'similar' is handled exclusively via onAnchorFromUrl.
    const normalizedView = (view === 'genres' || view === 'artists') ? view : null;
    if (normalizedView !== prevView.current) {
      prevView.current = normalizedView;
      if (normalizedView) {
        callbacksRef.current.onViewFromUrl?.(normalizedView);
      }
    }

    if (anchorId !== prevAnchorId.current) {
      prevAnchorId.current = anchorId;
      if (anchorId) {
        callbacksRef.current.fetchArtistById(anchorId).then((artist) => {
          if (artist) callbacksRef.current.onAnchorFromUrl?.(artist);
        });
      } else {
        callbacksRef.current.onAnchorClearedFromUrl?.();
      }
    }
  }, []);

  // Initial load: process URL params once genres are ready.
  // If no view is in the URL, replaceState to add it so the URL always reflects the current tab.
  useEffect(() => {
    if (!genresLoaded || initialLoadProcessed.current) return;
    initialLoadProcessed.current = true;
    const params = new URLSearchParams(window.location.search);
    processUrlParams(
      params.get('genre'),
      params.get('artist'),
      params.get('view'),
      params.get('anchor'),
    );

    if (!params.has('view')) {
      const view = callbacksRef.current.getInitialView?.();
      if (view) {
        params.set('view', view);
        const search = params.toString();
        const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
        window.history.replaceState(window.history.state, '', newUrl);
        prevView.current = (view === 'genres' || view === 'artists') ? view : null;
      }
    }
  }, [genresLoaded, processUrlParams]);

  // Browser back/forward: popstate listener reads directly from window.location.
  // Also syncs historyIndex from event.state so native nav keeps canGoBack/canGoForward accurate.
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!callbacksRef.current.genresLoaded) return;

      const params = new URLSearchParams(window.location.search);
      processUrlParams(
        params.get('genre'),
        params.get('artist'),
        params.get('view'),
        params.get('anchor'),
      );

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

  // Shared push-state helper — applies and commits all param changes.
  const pushUrlState = useCallback((params: URLSearchParams) => {
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

  // App → URL: update entity (genre/artist drawer) and optionally nav state in one push.
  const updateUrl = useCallback((entity: UrlEntity, nav?: NavUpdate) => {
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

    if (nav !== undefined) {
      if (nav.view !== undefined) {
        if (nav.view) params.set('view', nav.view);
        else params.delete('view');
      }
      if (nav.anchor !== undefined) {
        if (nav.anchor) params.set('anchor', nav.anchor);
        else params.delete('anchor');
      }
    }

    prevGenreSlug.current = params.get('genre');
    prevArtistSlug.current = params.get('artist');

    pushUrlState(params);
  }, [pushUrlState]);

  // App → URL: update nav state (view tab + anchor) without touching entity params.
  const updateNavUrl = useCallback((view: UrlView | null, anchor?: string | null) => {
    const params = new URLSearchParams(window.location.search);

    if (view) params.set('view', view);
    else params.delete('view');

    if (anchor !== undefined) {
      if (anchor) params.set('anchor', anchor);
      else params.delete('anchor');
    }

    prevView.current = (view === 'genres' || view === 'artists') ? view : null;
    if (anchor !== undefined) prevAnchorId.current = anchor;

    pushUrlState(params);
  }, [pushUrlState]);

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

  return { updateUrl, updateNavUrl, canGoBack, canGoForward, goBack, goForward };
}
