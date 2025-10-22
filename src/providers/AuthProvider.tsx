import {createContext, PropsWithChildren, useEffect, useState} from "react";
import {Social, User} from "@/types";
import {
    changeUserEmail, changeUserPassword,
    deleteUserAccount,
    signInSocialUser,
    signInUser,
    signOutUser,
    signUpUser
} from "@/apis/authApi";
import {BetterAuthError, InferSessionFromClient, InferUserFromClient} from "better-auth";
import {getUserData} from "@/apis/usersApi";
import {DEFAULT_PLAYER, DEFAULT_THEME} from "@/constants";
import {authClient} from "@/lib/auth-client";

interface AuthContextType {
    user: User | undefined,
    loading: boolean,
    error: string | undefined,
    signIn: (email: string, password: string) => Promise<void>,
    signInSocial: (social: Social) => Promise<void>,
    signUp: (email: string, password: string, name: string) => Promise<void>,
    signOut: () => Promise<void>,
    changeEmail: (newEmail: string) => Promise<void>,
    changePassword: (newPassword: string, oldPassword: string) => Promise<void>,
    deleteUser: (password: string) => Promise<void>,
    validSession: (userID?: string) => boolean,
}

// Dummy context to avoid TS errors
const noUserContext = {
    user: undefined,
    loading: false,
    error: undefined,
    signIn: (email: string, password: string) => new Promise<void>((resolve, reject) => {}),
    signInSocial: (social: Social) => new Promise<void>((resolve, reject) => {}),
    signUp: (email: string, password: string, name: string) => new Promise<void>((resolve, reject) => {}),
    signOut: () => new Promise<void>((resolve, reject) => {}),
    changeEmail: (newEmail: string) => new Promise<void>((resolve, reject) => {}),
    changePassword: (newPassword: string, oldPassword: string) => new Promise<void>((resolve, reject) => {}),
    deleteUser: (password: string) => new Promise<void>((resolve, reject) => {}),
    validSession: (userID?: string) => false,
}

export const AuthContext = createContext<AuthContextType>(noUserContext);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | undefined>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>();

    const signIn = async (email: string, password: string) => {
        await apiCall(async () => {
            const { data, error } = await signInUser(email, password);
            if (data) {
                const userData = await getUserData(data.user.id);
                if (userData) {
                    setUser({
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        liked: userData.liked ? userData.liked : [],
                        preferences: userData.preferences,
                    });
                } else {
                    setError(`Error: no user data found for ${email}.`);
                }
            } else {
                setError(`Error: no auth user data found for ${email}.`);
            }
        });
    }

    const signInSocial = async (social: Social) => {
        await apiCall(async () => {
            const { data, error } = await signInSocialUser(social);
            if (data) {
                console.log(data)
            } else {
                setError(`Error: couldn't sign in user from ${social}.`);
            }
        });
    }

    const signUp = async (email: string, password: string, name: string) => {
        await apiCall(async () => {
            const { data, error } = await signUpUser(email, password, name);
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
    }

    const signOut = async () => {
        if (user) {
            await apiCall(async () => {
                const success = await signOutUser();
                if (success) {
                    setUser(undefined);
                } else {
                    setError(`Error: could not sign out user ${user?.email}: ${success}`)
                }
            });
        }
    }

    const changeEmail = async (newEmail: string) => {
        if (user) {
            await apiCall(async () => {
                const success = await changeUserEmail(newEmail);
                if (success) {
                    setUser({...user, email: newEmail});
                } else {
                    setError(`Error: could not change user email.`)
                }
            });
        }
    }

    const changePassword = async (newPassword: string, currentPassword: string) => {
        if (user) {
            await apiCall(async () => {
                const { data, error } = await changeUserPassword(newPassword, currentPassword);
            });
        }
    }

    const deleteUser = async (password?: string) => {
        if (user) {
            await apiCall(async () => {
                await deleteUserAccount(password);
                //setUser(undefined);
            });
        }
    }

    const resetError = () => setError(undefined);

    // Encloses an api call with loading and error handling
    const apiCall = async (call: () => Promise<void>) => {
        resetError();
        setLoading(true);
        try {
            await call();
        } catch (err) {
            if (err instanceof BetterAuthError) {
                setError(err.message);
            }
        }
        setLoading(false);
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
    }, [error]);

    const initializeFromSession = () => {
        console.log(session)
        if (session) {
            getUserData(session.user.id).then(userData => {
                if (userData) {
                    console.log(userData)
                    setUser({
                        id: session.user.id,
                        name: session.user.name,
                        email: session.user.email,
                        liked: userData.liked ? userData.liked : [],
                        preferences: userData.preferences,
                        socialUser: userData.socialUser,
                    });
                } else {
                    setError(`Error: no user data found.`);
                }
            });
        } else {
            setError(`Error: no user data found.`);
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
        }}>
            {children}
        </AuthContext.Provider>
    )
}