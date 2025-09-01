import {envBoolean} from "@/lib/utils";
import {useEffect, useState} from "react";
import {Artist} from "@/types";
import axios, {AxiosError} from "axios";

const url = envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)
    ? import.meta.env.VITE_LOCALHOST
    : (import.meta.env.VITE_SERVER_URL
        || (import.meta.env.DEV ? '/api' : `https://rhizome-server-production.up.railway.app`));

const useSimilarArtists = (artist?: Artist) => {
    const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
    const [similarArtistsError, setSimilarArtistsError] = useState<AxiosError>();
    const [similarArtistsLoading, setSimilarArtistsLoading] = useState(false);

    const fetchSimilarArtists = async () => {
        if (artist) {
            setSimilarArtistsLoading(true);
            try {
                const response = await axios.get(`${url}/artists/similar/${artist.id}`);
                setSimilarArtists([artist, ...response.data]);
            } catch (err) {
                if (err instanceof AxiosError) {
                    setSimilarArtistsError(err);
                }
            }
            setSimilarArtistsLoading(false);
        }
    }

    useEffect(() => {
        fetchSimilarArtists();
    }, [artist]);

    return { similarArtists, similarArtistsLoading, similarArtistsError };
}

export default useSimilarArtists;
