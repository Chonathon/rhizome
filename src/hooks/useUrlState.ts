import { useCallback, useEffect, useRef, useState } from 'react';
import { toSlug } from '@/lib/urlUtils';
import type { Artist, Genre, UrlView } from '@/types';

interface UseUrlStateOptions {
  findGenreBySlug: (slug: string) => Genre | undefined;
  fetchArtistById: (id: string) => Promise<Artist | undefined>;
  onGenreFromUrl?: (genre: Genre) => void;
  onArtistFromUrl?: (artist: Artist) => void;
  onGenreClearedFromUrl?: () => void;
  onArtistClearedFromUrl?: () => void;
  onViewFromUrl?: (view: UrlView, collectionMode: boolean, anchorId: string | null) => void;
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
  updateView: (view: UrlView | null, opts?: { collection?: boolean; anchor?: string | null }) => void;
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
 * Syncs artist/genre drawer state and navigation view to the URL via
 * `window.history.pushState`. Handles initial page load and browser back/forward.
 *
 * Call `updateUrl` when opening or closing a drawer:
 * ```ts
 * updateUrl({ type: 'artist', id: artist.id, name: artist.name });
 * updateUrl({ type: 'genre', name: genre.name });
 * updateUrl(null); // dismiss
 * ```
 *
 * Call `updateView` when the active graph/mode changes:
 * ```ts
 * updateView('genres');
 * updateView('artists');
 * updateView('artists', { collection: true });
 * updateView('similar', { anchor: artist.id });
 * updateView(null); // back to default (genres)
 * ```
 */
export function useUrlState(options: UseUrlStateOptions): UrlStateResult {
  const prevGenreSlug = useRef<string | null>(null);
  const prevArtistSlug = useRef<string | null>(null);
  const prevView = useRef<string | null>(null);
  const initialLoadProcessed = useRef(false);

  // historyIndex is seeded from window.history.state on every mount (survives refresh).
  const historyIndex = useRef(getStoredHistoryIndex());
  const forwardCount = useRef(0);
  const [canGoBack, setCanGoBack] = useState(() => historyIndex.current > 0);
  const [canGoForward, setCanGoForward] = useState(false);

  const { genresLoaded } = options;

  // Store all options in a ref so effects/listeners always see latest values
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // Shared logic: resolve URL slugs → open/close drawers and restore view
  const processUrlParams = useCallback((
    genreSlug: string | null,
    artistSlug: string | null,
    view: string | null,
    collectionMode: boolean,
    anchorSlug: string | null,
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

    // Restore navigation view state
    const viewKey = `${view ?? 'genres'}|${collectionMode}|${anchorSlug ?? ''}`;
    if (viewKey !== prevView.current) {
      prevView.current = viewKey;
      if (view === 'genres' || view === 'artists' || view === 'similar') {
        callbacksRef.current.onViewFromUrl?.(view, collectionMode, anchorSlug);
      } else if (!view) {
        // No view param defaults to genres
        callbacksRef.current.onViewFromUrl?.('genres', false, null);
      }
    }
  }, []);

  // Initial load: process URL params once genres are ready
  useEffect(() => {
    if (!genresLoaded || initialLoadProcessed.current) return;
    initialLoadProcessed.current = true;
    const params = new URLSearchParams(window.location.search);
    const rawView = params.get('view');
    const view = rawView === 'genres' || rawView === 'artists' || rawView === 'similar' ? rawView : null;
    processUrlParams(
      params.get('genre'),
      params.get('artist'),
      view,
      params.get('collection') === 'true',
      params.get('anchor'),
    );
  }, [genresLoaded, processUrlParams]);

  // Browser back/forward: popstate listener reads directly from window.location.
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!callbacksRef.current.genresLoaded) return;

      const params = new URLSearchParams(window.location.search);
      const rawView = params.get('view');
      const view = rawView === 'genres' || rawView === 'artists' || rawView === 'similar' ? rawView : null;
      processUrlParams(
        params.get('genre'),
        params.get('artist'),
        view,
        params.get('collection') === 'true',
        params.get('anchor'),
      );

      // Sync history index from the restored history entry's state.
      const newIndex: number = event.state?.historyIndex ?? 0;
      const prevIndex = historyIndex.current;

      if (newIndex < prevIndex) {
        forwardCount.current += prevIndex - newIndex;
      } else if (newIndex > prevIndex) {
        forwardCount.current = Math.max(0, forwardCount.current - (newIndex - prevIndex));
      }

      historyIndex.current = newIndex;
      setCanGoBack(newIndex > 0);
      setCanGoForward(forwardCount.current > 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [processUrlParams]);

  // Shared push logic
  const pushState = useCallback((params: URLSearchParams) => {
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

  // App → URL: update entity (artist/genre drawer) while preserving view params.
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

    pushState(params);
  }, [pushState]);

  // App → URL: update navigation view while preserving entity params.
  const updateView = useCallback((
    view: UrlView | null,
    opts?: { collection?: boolean; anchor?: string | null },
  ) => {
    const params = new URLSearchParams(window.location.search);

    if (view) {
      params.set('view', view);
    } else {
      params.delete('view');
    }

    if (opts?.collection) {
      params.set('collection', 'true');
    } else {
      params.delete('collection');
    }

    if (opts?.anchor) {
      params.set('anchor', opts.anchor);
    } else {
      params.delete('anchor');
    }

    const viewKey = `${view ?? 'genres'}|${opts?.collection ?? false}|${opts?.anchor ?? ''}`;
    prevView.current = viewKey;

    pushState(params);
  }, [pushState]);

  const goBack = useCallback(() => {
    if (historyIndex.current <= 0) return;
    window.history.back();
    const newIndex = historyIndex.current - 1;
    historyIndex.current = newIndex;
    forwardCount.current++;
    setCanGoBack(newIndex > 0);
    setCanGoForward(true);
  }, []);

  const goForward = useCallback(() => {
    if (forwardCount.current <= 0) return;
    window.history.forward();
    historyIndex.current++;
    forwardCount.current--;
    setCanGoBack(true);
    setCanGoForward(forwardCount.current > 0);
  }, []);

  return { updateUrl, updateView, canGoBack, canGoForward, goBack, goForward };
}
