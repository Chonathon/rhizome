import {useEffect, useState} from "react";
import {Preferences} from "@/types";
import {serverUrl} from "@/lib/utils";
import axios, {AxiosError} from "axios";

const url = serverUrl();

export const useUserData = (userID?: string) => {
    const [likedArtists, setLikedArtists] = useState<string[]>([]);
    const [preferences, setPreferences] = useState<Preferences>();
    const [userLoading, setUserLoading] = useState<boolean>(false);
    const [userError, setUserError] = useState<AxiosError>();

    const getUserData = async () => {
        if (userID) {
            resetUserError();
            setUserLoading(true);
            try {
                const response = await axios.get(`${url}/users/${userID}`);
                setPreferences(response.data.preferences);
                if (response.data.liked && response.data.liked.length) {
                    setLikedArtists(response.data.liked.map((l: { id: string, date: Date }) => l.id));
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setUserError(err);
                }
            }
            setUserLoading(false);
        }
    }

    const likeArtist = async (artistID: string) => {
        if (userID) {
            try {
                const response = await axios.put(`${url}/users/like/${userID}/${artistID}`);
                if (response.status === 200) {
                    setLikedArtists([...likedArtists, artistID]);
                    return true;
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setUserError(err);
                }
            }
            return false;
        }
    }

    const unlikeArtist = async (artistID: string) => {
        if (userID) {
            try {
                const response = await axios.put(`${url}/users/unlike/${userID}/${artistID}`);
                if (response.status === 200) {
                    setLikedArtists(likedArtists.filter(a => a !== artistID));
                    return true;
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setUserError(err);
                }
            }
            return false;
        }
    }

    const updatePreferences = async (newPrefs: Preferences) => {
        if (userID) {
            try {
                const response = await axios.put(`${url}/users/preferences`, {
                    data: { id: userID, preferences: newPrefs }
                });
                if (response.status === 200) {
                    setPreferences(newPrefs);
                    return true;
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setUserError(err);
                }
            }
            return false;
        }
    }

    const resetUserError = () => setUserError(undefined);

    useEffect(() => {
        getUserData();
    }, [userID]);

    return {
        likedArtists,
        preferences,
        userLoading,
        userError,
        resetUserError,
        likeArtist,
        unlikeArtist,
        updatePreferences,
    }
}