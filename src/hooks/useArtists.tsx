import {useEffect, useState} from "react";
import {Artist, ArtistNodeLimitType, BadDataReport, BasicNode, NodeLink} from "@/types";
import axios, {AxiosError} from "axios";
import {envBoolean} from "@/lib/utils";
import {DEFAULT_NODE_COUNT, TOP_ARTISTS_TO_FETCH} from "@/constants";

const url = envBoolean(import.meta.env.VITE_USE_LOCAL_SERVER)
    ? import.meta.env.VITE_LOCALHOST
    : (import.meta.env.VITE_SERVER_URL
        || (import.meta.env.DEV ? '/api' : `https://rhizome-server-production.up.railway.app`));

const useArtists = (genreIDs: string[], topAmount = TOP_ARTISTS_TO_FETCH, filter: ArtistNodeLimitType, amount: number, initial: boolean) => {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistLinks, setArtistLinks] = useState<NodeLink[]>([]);
    const [artistsLoading, setArtistsLoading] = useState(false);
    const [artistsError, setArtistsError] = useState<AxiosError>();
    const [artistsDataFlagLoading, setArtistsDataFlagLoading] = useState<boolean>(false);
    const [artistsDataFlagError, setArtistsDataFlagError] = useState<AxiosError>();
    const [totalArtistsInDB, setTotalArtistsInDB] = useState<number>(DEFAULT_NODE_COUNT);
    const [topArtists, setTopArtists] = useState<Artist[]>([]);
    const [artistsYTLoading, setArtistsYTLoading] = useState<boolean>(false);
    const [artistYTLoadingKey, setArtistYTLoadingKey] = useState<string>('');
    const [artistsYTError, setArtistsYTError] = useState<AxiosError>();

    const fetchArtists = async () => {
        resetArtistsError();
        if (!initial) {
            setArtistsLoading(true);
            // console.log('fetching....')
            try {
                const selectedSize = genreIDs.length;
                if (selectedSize === 0) {
                    const response = await axios.get(`${url}/artists/${filter}/${amount}`);
                    setArtists(response.data.artists);
                    setArtistLinks(response.data.links);
                    setTotalArtistsInDB(response.data.count);
                }
                if (selectedSize === 1) {
                    const topRes = await axios.get(`${url}/artists/top/${genreIDs[0]}/${topAmount}`);
                    setTopArtists(topRes.data);
                }
                if (selectedSize > 0) {
                    const response = await axios.post(`${url}/artists/${filter}/${amount}`, {genres: genreIDs});
                    const artistCount = response.data.artists.length;
                    setArtists(response.data.artists);
                    setArtistLinks(response.data.links);
                    setTotalArtistsInDB(
                        response.data.count > DEFAULT_NODE_COUNT && artistCount === DEFAULT_NODE_COUNT
                            ? response.data.count
                            : artistCount
                    );
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setArtistsError(err);
                }
            }
            setArtistsLoading(false);
        }
    }

    const fetchAllArtists = async (filter?: string, amount?: number) => {
        if (!genreIDs && filter && amount) {
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

    const fetchMultipleGenresArtists = async (genres: string[], filter?: string, amount?: number) => {
        if (genres.length && filter && amount) {
            setArtistsLoading(true);
            try {
                if (genres.length === 1) {
                    const topRes = await axios.get(`${url}/artists/top/${genres[0]}/${topAmount}`);
                    setTopArtists(topRes.data);
                }
                const response = await axios.post(`${url}/artists/${filter}/${amount}`, {genres: genres});
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
    }, [genreIDs, filter, amount, initial]);

    const flagBadArtistData = async (report: BadDataReport) => {
        resetArtistsDataFlagError();
        setArtistsDataFlagLoading(true);
        let success = false;
        try {
            const response = await axios.post(`${url}/artists/baddata/report/submit`, { report: report });
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

    const fetchArtistTopTracksYT = async (artistID: string, artistName: string) => {
        resetArtistsYTError();
        setArtistsYTLoading(true);
        setArtistYTLoadingKey(`artist:${artistID}`);
        try {
            const response = await axios.get(`${url}/artists/toptracks/${artistID}/${artistName}`);
            const topTracks: string[] = response.data;
            return topTracks;
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsYTError(err);
            }
        } finally {
            setArtistsYTLoading(false);
            setArtistYTLoadingKey('');
        }
        return [];
    }

    const fetchGenreTopTracksYT = async (genreName: string, topArtists: BasicNode[]) => {
        resetArtistsYTError();
        setArtistsYTLoading(true);
        setArtistYTLoadingKey(`genre:${genreName}`);
        try {
            const response = await axios.post(`${url}/artists/toptracks/multiple`, { artists: topArtists });
            const topTracks: string[] = response.data;
            return topTracks;
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsYTError(err);
            }
        } finally {
            setArtistsYTLoading(false);
            setArtistYTLoadingKey('');
        }
        return [];
    }

    const resetArtistsError = () => setArtistsError(undefined);
    const resetArtistsYTError = () => setArtistsYTError(undefined);
    const resetArtistsDataFlagError = () => setArtistsDataFlagError(undefined);

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
        topArtists,
        fetchMultipleGenresArtists,
        fetchArtistTopTracksYT,
        artistsYTError,
        resetArtistsError,
        resetArtistsYTError,
        resetArtistsDataFlagError,
        fetchGenreTopTracksYT,
        artistsYTLoading,
        artistYTLoadingKey,
    };
}

export default useArtists;
