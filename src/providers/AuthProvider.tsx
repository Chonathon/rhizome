import {createContext, PropsWithChildren, useEffect, useState} from "react";
import {Social, User} from "@/types";
import {
    changeUserEmail, changeUserPassword,
    deleteUserAccount, forgotUserPassword,
    signInSocialUser,
    signInUser,
    signOutUser,
    signUpUser, updateUserAccount
} from "@/apis/authApi";
import {BetterAuthError, InferSessionFromClient, InferUserFromClient} from "better-auth";
import {getUserData} from "@/apis/usersApi";
import {DEFAULT_PLAYER, DEFAULT_THEME} from "@/constants";
import {authClient} from "@/lib/auth-client";
import {until} from "@/lib/utils";

interface AuthContextType {
    user: User | undefined,
    loading: boolean,
    error: string | undefined,
    signIn: (email: string, password: string) => Promise<boolean>,
    signInSocial: (social: Social) => Promise<boolean>,
    signUp: (email: string, password: string, name: string) => Promise<boolean>,
    signOut: () => Promise<boolean>,
    changeEmail: (newEmail: string) => Promise<boolean>,
    changePassword: (newPassword: string, oldPassword: string) => Promise<boolean>,
    deleteUser: (password?: string) => Promise<boolean>,
    updateUser: (name?: string, image?: string) => Promise<boolean>,
    validSession: (userID?: string) => boolean,
    forgotPassword: (email: string) => Promise<boolean>,
}

// Dummy context to avoid TS errors
const noUserContext = {
    user: undefined,
    loading: false,
    error: undefined,
    signIn: (email: string, password: string) => new Promise<boolean>((resolve, reject) => {}),
    signInSocial: (social: Social) => new Promise<boolean>((resolve, reject) => {}),
    signUp: (email: string, password: string, name: string) => new Promise<boolean>((resolve, reject) => {}),
    signOut: () => new Promise<boolean>((resolve, reject) => {}),
    changeEmail: (newEmail: string) => new Promise<boolean>((resolve, reject) => {}),
    changePassword: (newPassword: string, oldPassword: string) => new Promise<boolean>((resolve, reject) => {}),
    deleteUser: (password?: string) => new Promise<boolean>((resolve, reject) => {}),
    updateUser: (name?: string, image?: string) => new Promise<boolean>((resolve, reject) => {}),
    validSession: (userID?: string) => false,
    forgotPassword: (email: string) => new Promise<boolean>((resolve, reject) => {}),
}

export const AuthContext = createContext<AuthContextType>(noUserContext);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | undefined>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>();

    const signIn = async (email: string, password: string) => {
        return await apiCall(async () => {
            const { data, error: resError } = await signInUser(email, password);
            if (resError) throw resError;
            refetchSession();
            if (!data) {
                setError(`Error: no user data found for ${email}.`);
            }
        });
    }

    const signInSocial = async (social: Social) => {
        return await apiCall(async () => {
            const { data, error: resError } = await signInSocialUser(social);
            if (resError) throw resError;
            if (!data) {
                setError(`Error: couldn't sign in user from ${social}.`);
            }
        });
    }

    const signUp = async (email: string, password: string, name: string) => {
        const success = await apiCall(async () => {
            const { data, error: resError } = await signUpUser(email, password, name);
            if (resError) throw resError;
            if (data) {
                setUser({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    liked: [],
                    preferences: { theme: DEFAULT_THEME, player: DEFAULT_PLAYER },
                });
            } else {
                setError(`Error: unsuccessful account setup.`);
            }
        });
        refetchSession();
        return success;
    }

    const signOut = async () => {
        let success = false;
        if (user) {
            success = await apiCall(async () => {
                const result = await signOutUser();
                if (result === true) {
                    setUser(undefined);
                } else {
                    setError(`Error: could not sign out user ${user?.email}: ${result}`);
                    throw result;
                }
            });
        }
        return success;
    }

    const changeEmail = async (newEmail: string) => {
        let success = false;
        if (user) {
            success = await apiCall(async () => {
                const result = await changeUserEmail(newEmail);
                if (result === true) {
                    setUser({...user, email: newEmail});
                } else {
                    setError(`Error: could not change user email.`);
                    throw result;
                }
            });
        }
        return success;
    }

    const changePassword = async (newPassword: string, currentPassword: string) => {
        let success = false;
        if (user) {
            success = await apiCall(async () => {
                const { data, error: resError } = await changeUserPassword(newPassword, currentPassword);
                if (resError) throw resError;
            });
        }
        return success;
    }

    const deleteUser = async (password?: string) => {
        let success = false;
        if (user) {
            success = await apiCall(async () => {
                const result = await deleteUserAccount(password);
                if (result !== true) {
                    setError('Error: could not delete user account.');
                    throw result;
                }
            });
        }
        return success;
    }

    const updateUser = async (name?: string, image?: string) => {
        let success = false;
        if (user) {
            success = await apiCall(async () => {
                const result = await updateUserAccount(name, image);
                if (result !== true) {
                    setError('Error: could not update user account.');
                    throw result;
                }
            });
        }
        return success;
    }

    const forgotPassword = async (email: string) => {
        return await apiCall(async () => {
            const { data, error: resError } = await forgotUserPassword(email);
            if (resError) throw resError;
        });
    }

    const resetError = () => setError(undefined);

    // Encloses an api call with loading and error handling
    const apiCall = async (call: () => Promise<void>) => {
        let success = false;
        resetError();
        setLoading(true);
        try {
            await call();
            success = true;
        } catch (err) {
            success = false;
            if (err instanceof BetterAuthError) {
                setError(err.message);
            }
        }
        setLoading(false);
        return success;
    }

    const {
        data: session,
        isPending: isSessionLoading,
        error: sessionError,
        refetch: refetchSession,
    } = authClient.useSession();

    const validSession = (userID?: string) => {
        console.log(session)
        console.log(user)
        if (!session) return false;
        return userID ? session.user.id === userID : user ? session.user.id === user.id : false;
    }

    useEffect(() => {
        refetchSession();
    }, []);

    useEffect(() => {
        initializeFromSession();
    }, [session]);

    useEffect(() => {
        if (error) console.error(error);
        if (sessionError) console.error(sessionError);
    }, [error, sessionError]);

    const initializeFromSession = () => {
        //console.log(session)
        if (session) {
            getUserData(session.user.id).then(userData => {
                if (userData) {
                    setUser({
                        id: session.user.id,
                        name: session.user.name,
                        email: session.user.email,
                        liked: userData.liked ? userData.liked : [],
                        preferences: userData.preferences,
                        socialUser: userData.socialUser,
                        image: userData.image,
                    });
                } else {
                    setError(`Error: no user data found in db.`);
                }
            });
        } else {
            setError(`Error: no session found for user.`);
            refetchSession();
        }
    }

    return (
        <AuthContext.Provider value={{
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
            validSession,
            updateUser,
            forgotPassword,
        }}>
            {children}
        </AuthContext.Provider>
    )
}