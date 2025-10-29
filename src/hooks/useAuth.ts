import {useContext, useEffect, useState} from "react";
import {Preferences} from "@/types";
import {AuthContext} from "@/providers/AuthProvider";
import {likeArtistUser, unlikeArtistUser, updateUserPreferences} from "@/apis/usersApi";

const useAuth = () => {
    const [userID, setUserID] = useState<string>();
    const [userName, setUserName] = useState<string>();
    const [userEmail, setUserEmail] = useState<string>();
    const [userImage, setUserImage] = useState<string>();
    const [preferences, setPreferences] = useState<Preferences>();
    const [likedArtists, setLikedArtists] = useState<string[]>([]);
    const [isSocialUser, setIsSocialUser] = useState<boolean | undefined>();

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
        validSession,
        forgotPassword,
        resetPassword,
    } = useContext(AuthContext);

    useEffect(() => {
        setUserID(user ? user.id : undefined);
        setUserName(user ? user.name : undefined);
        setUserEmail(user ? user.email : undefined);
        setUserImage(user ? user.image : undefined);
        setPreferences(user ? user.preferences : undefined);
        setLikedArtists(user && user.liked ? user.liked.map(l => l.id) : []);
        setIsSocialUser(user ? user.socialUser : false);
    }, [user]);

    const likeArtist = async (artistID: string) => {
        if (userID && !likedArtists.includes(artistID)) {
            const success = await likeArtistUser(userID, artistID);
            if (success) setLikedArtists([...likedArtists, artistID]);
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

    return {
        userID,
        userName,
        userEmail,
        userImage,
        preferences,
        likedArtists,
        isSocialUser,
        signIn,
        signInSocial,
        signUp,
        signOut,
        changeEmail,
        changePassword,
        deleteUser,
        updateUser,
        likeArtist,
        unlikeArtist,
        updatePreferences,
        validSession,
        forgotPassword,
        resetPassword,
        authLoading: loading,
        authError: error,
    }
}

export default useAuth;