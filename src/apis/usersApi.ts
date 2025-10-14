import axios from "axios";
import {serverUrl} from "@/lib/utils";
import {Preferences} from "@/types";

const url = serverUrl();

export const getUserData = async (userID: string) => {
    const response = await axios.get(`${url}/users/${userID}`);
    return response.data;
}

export const likeArtist = async (userID: string, artistID: string) => {
    const response = await axios.put(`${url}/users/like/${userID}/${artistID}`);
    return response.status === 200;
}

export const unlikeArtist = async (userID: string, artistID: string) => {
    const response = await axios.put(`${url}/users/unlike/${userID}/${artistID}`);
    return response.status === 200;
}

export const updatePreferences = async (userID: string, preferences: Preferences) => {
    const response = await axios.put(`${url}/users/preferences`, {
        data: { id: userID, preferences }
    });
    return response.status === 200;
}