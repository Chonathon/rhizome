import {useEffect, useState} from "react";
import {Artist, ArtistNodeLimitType, BadDataReport, BasicNode, NodeLink, TopTrack} from "@/types";
import axios, {AxiosError} from "axios";
import {serverUrl} from "@/lib/utils";
import {DEFAULT_NODE_COUNT, MAX_NODES, TOP_ARTISTS_TO_FETCH} from "@/constants";

const url = serverUrl();

const useArtists = (genreIDs: string[], topAmount = TOP_ARTISTS_TO_FETCH, filter: ArtistNodeLimitType, amount: number, initial: boolean) => {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistLinks, setArtistLinks] = useState<NodeLink[]>([]);
    const [artistsLoading, setArtistsLoading] = useState(false);
    const [artistsError, setArtistsError] = useState<AxiosError>();
    const [artistsDataFlagLoading, setArtistsDataFlagLoading] = useState<boolean>(false);
    const [artistsDataFlagError, setArtistsDataFlagError] = useState<AxiosError>();
    const [totalArtistsInDB, setTotalArtistsInDB] = useState<number>(DEFAULT_NODE_COUNT);
    const [artistsPlayIDsLoading, setArtistsPlayIDsLoading] = useState<boolean>(false);
    const [artistPlayIDLoadingKey, setArtistPlayIDLoadingKey] = useState<string>('');
    const [artistsPlayIDsError, setArtistsPlayIDsError] = useState<AxiosError>();
    const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);

    const fetchArtists = async () => {
        resetArtistsError();
        if (!initial) {
            setArtistsLoading(true);
            console.log('fetching....')
            try {
                const selectedSize = genreIDs.length;
                if (selectedSize === 0) {
                    const response = await axios.get(`${url}/artists/${filter}/${amount}`);
                    setArtists(response.data.artists);
                    setArtistLinks(response.data.links);
                    setTotalArtistsInDB(response.data.count);
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

    const fetchArtistTopTracks = async (artistID: string, artistName: string) => {
        resetArtistsYTError();
        setArtistsPlayIDsLoading(true);
        const artistLoadingKey = `artist:${artistID}`;
        setArtistPlayIDLoadingKey(artistLoadingKey);
        let topTracks: TopTrack[] = [];
        try {
            const response = await axios.get(`${url}/artists/toptracks/${artistID}/${artistName}`);
            topTracks = response.data;
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsPlayIDsError(err);
            }
        } finally {
            setArtistsPlayIDsLoading(false);
            setArtistPlayIDLoadingKey('');
        }
        return topTracks;
    }

    const fetchLikedArtists = async (artists: string[], limit = MAX_NODES) => {
        resetArtistsError();
        setArtistsLoading(true);
        try {
            const response = await axios.post(`${url}/artists/multiple`, { artists: artists.slice(0, limit) });
            setArtists(response.data.artists);
            setArtistLinks(response.data.links);
            setTotalArtistsInDB(artists.length);
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsError(err);
            }
        }
        setArtistsLoading(false);
    }

    const fetchSingleArtist = async (artistID: string) => {
        resetArtistsYTError();
        setArtistsLoading(true);
        try {
            const response = await axios.get(`${url}/artists/fetch/id/${artistID}`);
            return response.data;
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsError(err);
            }
        }
        setArtistsLoading(false);
    }

    const fetchSimilarArtists = async (artist: Artist) => {
        resetArtistsError();
        setArtistsLoading(true);
        try {
            const response = await axios.get(`${url}/artists/fetch/similar/${artist.id}`);
            setSimilarArtists([artist, ...response.data]);
        } catch (err) {
            if (err instanceof AxiosError) {
                setArtistsError(err);
            }
        }
        setArtistsLoading(false);
    }

    const resetArtistsError = () => setArtistsError(undefined);
    const resetArtistsYTError = () => setArtistsPlayIDsError(undefined);
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
        fetchLikedArtists,
        totalArtistsInDB,
        fetchMultipleGenresArtists,
        fetchArtistTopTracks,
        artistsPlayIDsError,
        resetArtistsError,
        resetArtistsYTError,
        resetArtistsDataFlagError,
        artistsPlayIDsLoading,
        artistPlayIDLoadingKey,
        fetchSingleArtist,
        similarArtists,
        fetchSimilarArtists,
    };
}

export default useArtists;
