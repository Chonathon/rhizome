import {useContext, useEffect, useState} from "react";
import {Preferences} from "@/types";
import {AuthContext} from "@/providers/AuthProvider";
import {
    lastFMConnect,
    lastFMPreview, lastFMRefresh,
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
    const [lfmUsername, setLfmUsername] = useState<string>();
    const [lfmLastSync, setLfmLastSync] = useState<Date | undefined>();

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
        refetchSession,
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
        setLfmUsername(user && user.lfmUsername ? user.lfmUsername : undefined);
        setLfmLastSync(user && user.lfmLastSync ? user.lfmLastSync : undefined);
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
            if (success) {
                setLfmUsername(lfmUser);
                await refetchSession();
            }
            return success;
        } else {
            return false;
        }
    }

    const onLFMRemove = async (removeArtists: boolean) => {
        if (userID) {
            const success = await lastFMRemove(userID, removeArtists);
            if (success) {
                setLfmUsername(undefined);
                await refetchSession();
            }
            return success;
        } else {
            return false;
        }
    }

    const onLFMRefresh = async () => {
        if (userID) {
            const success = await lastFMRefresh(userID);
            if (success) {
                await refetchSession();
            }
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
        lfmLastSync,
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
        onLFMRefresh,
    }
}

export default useAuth;