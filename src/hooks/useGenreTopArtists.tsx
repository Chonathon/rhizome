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

  const fetchTopArtists = async () => {
    if (!genreId) {
      setTopArtists([]);
      return;
    }
    const artists = await getTopArtistsFromApi(genreId);
    if (artists && artists.length) setTopArtists(artists);
  };

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
    fetchTopArtists();
  }, [genreId, topAmount]);

  return {
    topArtists,
    loading,
    error,
    getTopArtistsFromApi,
  };
};

export default useGenreTopArtists;
