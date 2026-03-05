import { useSearchParams } from 'react-router';
import { useCallback, useEffect, useRef } from 'react';
import { parseUrlState, toSlug } from '@/lib/urlUtils';
import type { Artist, Genre } from '@/types';

interface UseUrlStateOptions {
  findGenreBySlug: (slug: string) => Genre | undefined;
  fetchArtistBySearch: (query: string) => Promise<Artist | undefined>;
  onGenreFromUrl?: (genre: Genre) => void;
  onArtistFromUrl?: (artist: Artist) => void;
  onGenreClearedFromUrl?: () => void;
  onArtistClearedFromUrl?: () => void;
  genresLoaded: boolean;
}

export interface UrlStateResult {
  updateUrl: (entity: { type: 'genre' | 'artist'; name: string } | null) => void;
}

export function useUrlState(options: UseUrlStateOptions): UrlStateResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const skipNextUrlToApp = useRef(false);
  const prevGenreSlug = useRef<string | null>(null);
  const prevArtistSlug = useRef<string | null>(null);

  const {
    findGenreBySlug,
    fetchArtistBySearch,
    genresLoaded,
  } = options;

  // Store callbacks in a ref to avoid effect dependency churn
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // URL → App: fires on searchParams changes (initial load + browser back/forward)
  useEffect(() => {
    if (skipNextUrlToApp.current) {
      skipNextUrlToApp.current = false;
      return;
    }

    if (!genresLoaded) return;

    const { genreSlug, artistSlug } = parseUrlState(searchParams);

    // Genre: resolve and open/close drawer
    if (genreSlug !== prevGenreSlug.current) {
      prevGenreSlug.current = genreSlug;
      if (genreSlug) {
        const genre = findGenreBySlug(genreSlug);
        if (genre) {
          callbacksRef.current.onGenreFromUrl?.(genre);
        }
      } else {
        callbacksRef.current.onGenreClearedFromUrl?.();
      }
    }

    // Artist: resolve via search API and open/close drawer
    if (artistSlug !== prevArtistSlug.current) {
      prevArtistSlug.current = artistSlug;
      if (artistSlug) {
        const query = artistSlug.replace(/-/g, ' ');
        fetchArtistBySearch(query).then((artist) => {
          if (artist) {
            callbacksRef.current.onArtistFromUrl?.(artist);
          }
        });
      } else {
        callbacksRef.current.onArtistClearedFromUrl?.();
      }
    }
  }, [searchParams, genresLoaded, findGenreBySlug, fetchArtistBySearch]);

  // Imperative URL updater — called from App handlers (node clicks, deselection)
  const updateUrl = useCallback((entity: { type: 'genre' | 'artist'; name: string } | null) => {
    skipNextUrlToApp.current = true;

    const params = new URLSearchParams(searchParams);

    if (entity === null) {
      params.delete('genre');
      params.delete('artist');
    } else if (entity.type === 'genre') {
      params.set('genre', toSlug(entity.name));
      params.delete('artist');
    } else {
      params.set('artist', toSlug(entity.name));
      params.delete('genre');
    }

    // Update prev refs to match what we're pushing
    prevGenreSlug.current = params.get('genre');
    prevArtistSlug.current = params.get('artist');

    setSearchParams(params, { replace: false });
  }, [searchParams, setSearchParams]);

  return { updateUrl };
}
