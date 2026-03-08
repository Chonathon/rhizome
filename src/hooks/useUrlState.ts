import { useCallback, useEffect, useRef } from 'react';
import { toSlug } from '@/lib/urlUtils';
import type { Artist, Genre } from '@/types';

interface UseUrlStateOptions {
  findGenreBySlug: (slug: string) => Genre | undefined;
  fetchArtistById: (id: string) => Promise<Artist | undefined>;
  onGenreFromUrl?: (genre: Genre) => void;
  onArtistFromUrl?: (artist: Artist) => void;
  onGenreClearedFromUrl?: () => void;
  onArtistClearedFromUrl?: () => void;
  genresLoaded: boolean;
}

export type UrlEntity =
  | { type: 'genre'; name: string }
  | { type: 'artist'; id: string; name: string }
  | null;

export interface UrlStateResult {
  updateUrl: (entity: UrlEntity) => void;
}

export function useUrlState(options: UseUrlStateOptions): UrlStateResult {
  const prevGenreSlug = useRef<string | null>(null);
  const prevArtistSlug = useRef<string | null>(null);
  const initialLoadProcessed = useRef(false);

  const { genresLoaded } = options;

  // Store all options in a ref so effects/listeners always see latest values
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // Shared logic: resolve URL slugs → open/close drawers
  const processUrlParams = useCallback((genreSlug: string | null, artistSlug: string | null) => {
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
  }, []);

  // Initial load: process URL params once genres are ready
  useEffect(() => {
    if (!genresLoaded || initialLoadProcessed.current) return;
    initialLoadProcessed.current = true;
    const params = new URLSearchParams(window.location.search);
    processUrlParams(params.get('genre'), params.get('artist'));
  }, [genresLoaded, processUrlParams]);

  // Browser back/forward: popstate listener reads directly from window.location
  useEffect(() => {
    const handlePopState = () => {
      if (!callbacksRef.current.genresLoaded) return;
      const params = new URLSearchParams(window.location.search);
      processUrlParams(params.get('genre'), params.get('artist'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [processUrlParams]);

  // App → URL: pushState directly — no React re-render, no router navigation
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
    window.history.pushState(null, '', newUrl);
  }, []);

  return { updateUrl };
}
