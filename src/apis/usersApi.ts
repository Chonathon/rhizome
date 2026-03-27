import axios from "axios";
import {serverUrl} from "@/lib/utils";
import {Preferences} from "@/types";

const url = serverUrl();

export const getUserData = async (userID: string) => {
    const response = await axios.get(`${url}/users/${userID}`);
    return response.data;
}

export const likeArtistUser = async (userID: string, artistID: string) => {
    const response = await axios.put(`${url}/users/like/${userID}/${artistID}`);
    return response.status === 200;
}

export const unlikeArtistUser = async (userID: string, artistID: string) => {
    const response = await axios.put(`${url}/users/unlike/${userID}/${artistID}`);
    return response.status === 200;
}

export const updateUserPreferences = async (userID: string, preferences: Preferences) => {
    const response = await axios.put(`${url}/users/preferences`, {
        data: { id: userID, preferences }
    });
    return response.status === 200;
}

export const validateAccessCode = async (email: string, accessCode: string) => {
    const response = await axios.get(`${url}/users/verify-access-code/${encodeURIComponent(accessCode)}/${encodeURIComponent(email)}`, {});
    return response.status === 200;
}

export const lastFMPreview = async (lfmUsername: string) => {
    const response = await axios.get(`${url}/users/lastfm/userpreview/${lfmUsername}`);
    return response.data.preview;
}

export const lastFMConnect = async (lfmUsername: string, userID: string) => {
    const response = await axios.put(`${url}/users/lastfm/${userID}/${lfmUsername}`);
    return response.status === 200;
}

export const lastFMRemove = async (userID: string, removeArtists: boolean) => {
    const response = await axios.put(`${url}/users/lastfm/remove/user/${userID}/${removeArtists}`);
    return response.status === 200;
}

export const lastFMRefresh = async (userID: string) => {
    const response = await axios.put(`${url}/users/lastfm/sync/${userID}/true`);
    return response.status === 200;
}

export const lastFMRecentTracks = async (lfmUsername: string, limit = 20) => {
    const response = await axios.get(`${url}/users/lastfm/recenttracks/${encodeURIComponent(lfmUsername)}`, {
        params: { limit },
    });
    return response.data.tracks as {
        name: string;
        artist: string;
        album: string;
        timestamp: number;
        nowPlaying: boolean;
        imageUrl: string | null;
    }[];
}