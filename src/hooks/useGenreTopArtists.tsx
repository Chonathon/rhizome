import { useEffect, useState } from "react";
import { Artist } from "@/types";
import axios, { AxiosError } from "axios";
import { serverUrl } from "@/lib/utils";
import { TOP_ARTISTS_TO_FETCH } from "@/constants";

const url = serverUrl();

/**
 * Reusable hook for fetching top artists for a specific genre.
 * This hook is agnostic and can be used by any component that needs genre top artists.
 *
 * @param genreId - The ID of the genre to fetch top artists for
 * @param topAmount - Number of top artists to fetch (defaults to TOP_ARTISTS_TO_FETCH)
 * @returns Object containing topArtists array, loading state, error state, and function to fetch topArtists directly
 */
const useGenreTopArtists = (genreId: string | undefined, topAmount = TOP_ARTISTS_TO_FETCH) => {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError>();
  const [resolvedGenreId, setResolvedGenreId] = useState<string | undefined>(undefined);

  const getTopArtistsFromApi = async (genreID?: string) => {
    if (!genreID) return;
    setLoading(true);
    setError(undefined);
    try {
      const response = await axios.get(`${url}/artists/top/${genreID}/${topAmount}`);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!genreId) {
      setTopArtists([]);
      setResolvedGenreId(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const currentGenreId = genreId;

    // Clear stale artists immediately so consumers don't render the previous genre.
    setTopArtists([]);
    setResolvedGenreId(undefined);

    const run = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const response = await axios.get(`${url}/artists/top/${currentGenreId}/${topAmount}`);
        if (!cancelled) {
          setTopArtists(response.data || []);
          setResolvedGenreId(currentGenreId);
        }
      } catch (err) {
        if (!cancelled && err instanceof AxiosError) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [genreId, topAmount]);

  return {
    topArtists,
    loading,
    error,
    getTopArtistsFromApi,
    resolvedGenreId,
  };
};

export default useGenreTopArtists;
