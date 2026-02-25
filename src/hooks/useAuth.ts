import {useContext, useEffect, useState} from "react";
import {Preferences} from "@/types";
import {AuthContext} from "@/providers/AuthProvider";
import {
    lastFMConnect,
    lastFMPreview,
    lastFMRemove,
    likeArtistUser,
    unlikeArtistUser,
    updateUserPreferences
} from "@/apis/usersApi";
import {DEFAULT_PREFERENCES, PHASE_VERSION} from "@/constants";

const useAuth = () => {
    const [userID, setUserID] = useState<string>();
    const [userName, setUserName] = useState<string>();
    const [userEmail, setUserEmail] = useState<string>();
    const [userImage, setUserImage] = useState<string>();
    const [preferences, setPreferences] = useState<Preferences>();
    const [likedArtists, setLikedArtists] = useState<string[]>([]);
    const [isSocialUser, setIsSocialUser] = useState<boolean | undefined>();
    const [userAccess, setUserAccess] = useState<string | undefined>()
    const [lfmUsername, setlfmUsername] = useState<string>();

    const {
        user,
        loading,
        error,
        signIn,
        signInSocial,
        signUp,
        signOut,
        changeEmail,
        changePassword,
        deleteUser,
        updateUser,
        updateUserAppAccess,
        validSession,
        forgotPassword,
        resetPassword,
    } = useContext(AuthContext);

    useEffect(() => {
        setUserID(user ? user.id : undefined);
        setUserName(user ? user.name : undefined);
        setUserEmail(user ? user.email : undefined);
        setUserImage(user ? user.image : undefined);
        setPreferences(user ? user.preferences : DEFAULT_PREFERENCES);
        setLikedArtists(user && user.liked ? user.liked.map(l => l.id) : []);
        setIsSocialUser(user ? user.socialUser : false);
        setUserAccess(user ? user.appAccess : undefined);
        if (user && !localStorage.getItem('versionLastAccessed')) {
            localStorage.setItem('versionLastAccessed', PHASE_VERSION);
        }
        setlfmUsername(user && user.lfmUsername ? user.lfmUsername : undefined);
    }, [user]);

    const likeArtist = async (artistID: string) => {
        if (userID && !likedArtists.includes(artistID)) {
            const success = await likeArtistUser(userID, artistID);
            if (success) {
                setLikedArtists([...likedArtists, artistID]);
            }
        }
    }

    const unlikeArtist = async (artistID: string) => {
        if (userID && likedArtists.includes(artistID)) {
            const success = await unlikeArtistUser(userID, artistID);
            if (success) setLikedArtists(likedArtists.filter(a => a !== artistID));
        }
    }

    const updatePreferences = async (newPreferences: Preferences) => {
        if (userID) {
            const success = await updateUserPreferences(userID, newPreferences);
            if (success) {
                setPreferences(newPreferences);
                return true;
            } else {
                console.error("Couldn't update preferences.");
            }
        }
        return false;
    }

    const clearUserData = () => {
        setUserID(undefined);
        setUserName(undefined);
        setUserEmail(undefined);
        setPreferences(undefined);
        setLikedArtists([]);
    }

    const onLFMPreview = async (lfmUser: string) => {
        try {
            return await lastFMPreview(lfmUser);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    const onLFMConnect = async (lfmUser: string) => {
        if (userID) {
            const success = await lastFMConnect(lfmUser, userID);
            if (success) setlfmUsername(lfmUser);
            return success;
        } else {
            return false;
        }
    }

    const onLFMRemove = async () => {
        if (userID) {
            const success = await lastFMRemove(userID);
            if (success) setlfmUsername(undefined);
            return success;
        } else {
            return false;
        }
    }

    return {
        userID,
        userName,
        userEmail,
        userImage,
        preferences,
        likedArtists,
        isSocialUser,
        userAccess,
        lfmUsername,
        signIn,
        signInSocial,
        signUp,
        signOut,
        changeEmail,
        changePassword,
        deleteUser,
        updateUser,
        updateUserAppAccess,
        likeArtist,
        unlikeArtist,
        updatePreferences,
        validSession,
        forgotPassword,
        resetPassword,
        authLoading: loading,
        authError: error,
        onLFMPreview,
        onLFMConnect,
        onLFMRemove,
    }
}

export default useAuth;