import {useEffect, useState} from "react";
import {Genre, NodeLink} from "@/types";
import axios, {AxiosError} from "axios";
import {envBoolean} from "@/lib/utils";

const url = envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)
    ? import.meta.env.VITE_LOCALHOST
    : import.meta.env.VITE_SERVER_URL || `https://rhizome-server-production.up.railway.app`;

const useGenres = (clusterMode: string) => {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [genreLinks, setGenreLinks] = useState<NodeLink[]>([]);
    const [genresLoading, setGenresLoading] = useState(true);
    const [genresError, setGenresError] = useState<AxiosError>();

    const fetchGenres = async () => {
        setGenresLoading(true);
        try {
            const response = await axios.get(`${url}/genres?clusterMode=${clusterMode}`);
            setGenres(response.data.genres);
            setGenreLinks(response.data.links);
        } catch (err) {
            if (err instanceof AxiosError) {
                setGenresError(err);
            }
        }
        setGenresLoading(false);
    }

    useEffect(() => {
        fetchGenres();
    }, [clusterMode]);

    return { genres, genreLinks, genresLoading, genresError };
}

export default useGenres;