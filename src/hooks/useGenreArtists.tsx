import {useEffect, useState} from "react";
import {Artist, NodeLink} from "@/types";
import axios, {AxiosError} from "axios";
import {envBoolean} from "@/lib/utils";

const url = envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)
    ? import.meta.env.VITE_LOCALHOST
    : (import.meta.env.VITE_SERVER_URL
        || (import.meta.env.DEV ? '/api' : `https://rhizome-server-production.up.railway.app`));

const useGenreArtists = (genreID?: string) => {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistLinks, setArtistLinks] = useState<NodeLink[]>([]);
    const [artistsLoading, setArtistsLoading] = useState(false);
    const [artistsError, setArtistsError] = useState<AxiosError>();

    const fetchArtists = async () => {
        if (genreID) {
            setArtistsLoading(true);
            try {
                const response = await axios.get(`${url}/artists/${genreID}`);
                setArtists(response.data.artists);
                setArtistLinks(response.data.links);
            } catch (err) {
                if (err instanceof AxiosError) {
                    setArtistsError(err);
                }
            }
            setArtistsLoading(false);
        }
    }

    useEffect(() => {
        fetchArtists();
    }, [genreID]);

    return { artists, artistsLoading, artistsError, artistLinks };
}

export default useGenreArtists;
