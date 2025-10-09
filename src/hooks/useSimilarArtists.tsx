import {envBoolean, serverUrl} from "@/lib/utils";
import {useEffect, useState} from "react";
import {Artist} from "@/types";
import axios, {AxiosError} from "axios";

const url = serverUrl();

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
