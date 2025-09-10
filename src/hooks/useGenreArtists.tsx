import {useEffect, useState} from "react";
import {Artist, NodeLink} from "@/types";
import axios, {AxiosError} from "axios";
import {envBoolean} from "@/lib/utils";

const url = envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)
    ? import.meta.env.VITE_LOCALHOST
    : (import.meta.env.VITE_SERVER_URL
        || (import.meta.env.DEV ? '/api' : `https://rhizome-server-production.up.railway.app`));

const useGenreArtists = (genreID?: string, topAmount = 8) => {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistLinks, setArtistLinks] = useState<NodeLink[]>([]);
    const [artistsLoading, setArtistsLoading] = useState(false);
    const [artistsError, setArtistsError] = useState<AxiosError>();
    const [artistsDataFlagLoading, setArtistsDataFlagLoading] = useState<boolean>(false);
    const [artistsDataFlagError, setArtistsDataFlagError] = useState<AxiosError>();
    const [totalArtistsInDB, setTotalArtistsInDB] = useState<number | undefined>(undefined);
    const [topArtists, setTopArtists] = useState<Artist[]>([]);

    const fetchArtists = async () => {
        if (genreID) {
            setArtistsLoading(true);
            try {
                const topRes = await axios.get(`${url}/artists/top/${genreID}/${topAmount}`);
                setTopArtists(topRes.data);
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

    const fetchAllArtists = async (filter?: string, amount?: number) => {
        if (!genreID && filter && amount) {
            setArtistsLoading(true);
            try {
                const response = await axios.get(`${url}/artists/${filter}/${amount}`);
                setArtists(response.data.artists);
                setArtistLinks(response.data.links);
                setTotalArtistsInDB(response.data.count);
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

    const flagBadArtistData = async (artistID: string, reason = 'none') => {
        setArtistsDataFlagLoading(true);
        let success = false;
        try {
            const response = await axios.put(`${url}/artists/bdflag/${artistID}/${reason}`);
            if (response.status === 200) {
                success = true;
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsDataFlagError(err);
            }
        }
        setArtistsDataFlagLoading(false);
        return success;
    }

    return {
        artists,
        artistsLoading,
        artistsError,
        artistLinks,
        flagBadArtistData,
        artistsDataFlagLoading,
        artistsDataFlagError,
        fetchAllArtists,
        totalArtistsInDB,
        topArtists
    };
}

export default useGenreArtists;
