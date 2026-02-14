import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Artist, Genre } from "@/types";
import { serverUrl } from "@/lib/utils";
import {
    buildUserFeedProfile,
    UserFeedProfile,
} from "@/lib/collectionFeedProfile";
import useAuth from "./useAuth";

const url = serverUrl();

export function useUserFeedProfile(): {
    profile: UserFeedProfile | null;
    loading: boolean;
    hasCollection: boolean;
} {
    const { likedArtists } = useAuth();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch genres once on mount
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get(`${url}/genres`);
                setGenres(response.data.genres);
            } catch (err) {
                console.error("Failed to fetch genres for feed profile:", err);
            }
        };
        fetchGenres();
    }, []);

    // Fetch full artist objects when liked artists change
    useEffect(() => {
        if (likedArtists.length === 0) {
            setArtists([]);
            return;
        }

        const fetchArtists = async () => {
            setLoading(true);
            try {
                const response = await axios.post(
                    `${url}/artists/multiple`,
                    { artists: likedArtists }
                );
                setArtists(response.data.artists);
            } catch (err) {
                console.error(
                    "Failed to fetch artists for feed profile:",
                    err
                );
            }
            setLoading(false);
        };
        fetchArtists();
    }, [likedArtists]);

    const profile = useMemo(() => {
        if (artists.length === 0 || genres.length === 0) return null;
        return buildUserFeedProfile(artists, genres);
    }, [artists, genres]);

    return {
        profile,
        loading,
        hasCollection: likedArtists.length > 0,
    };
}
