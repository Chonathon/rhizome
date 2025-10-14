import {createContext, useState} from "react";
import {Social, User} from "@/types";
import {signInUser, signOutUser, signUpUser} from "@/apis/authApi";
import {BetterAuthError} from "better-auth";
import {getUserData} from "@/apis/usersApi";
import {DEFAULT_PLAYER, DEFAULT_THEME} from "@/constants";

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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState<User | undefined>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>();

    const signIn = async (email: string, password: string) => {
        resetError();
        setLoading(true);
        try {
            const { data, error } = await signInUser(email, password);
            if (data) {
                const userData = await getUserData(data.user.id);
                if (userData) {
                    setUser({
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        liked: userData.data.liked ? userData.data.liked : [],
                        preferences: userData.data.preferences,
                    });
                } else {
                    setError(`Error: no user data found for ${email}.`);
                }
            } else {
                setError(`Error: no user data found for ${email}.`);
            }
        } catch (err) {
            if (err instanceof BetterAuthError) {
                setError(err.message);
            }
        }
        setLoading(false);
    }

    const signInSocial = async (social: Social) => {

    }

    const signUp = async (email: string, password: string, name: string) => {
        resetError();
        setLoading(true);
        try {
            const { data, error } = await signUpUser(email, password, name);
            if (data) {
                setUser({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    liked: [],
                    preferences: { theme: DEFAULT_THEME, player: DEFAULT_PLAYER },
                })
            } else {
                setError(`Error: unsuccessful account setup.`);
            }
        } catch (err) {
            if (err instanceof BetterAuthError) {
                setError(err.message);
            }
        }
        setLoading(false);
    }

    const signOut = async () => {
        if (user) {
            resetError();
            setLoading(true);
            try {
                const success = await signOutUser();
                if (success) {
                    setUser(undefined);
                } else {
                    setError(`Error: could not sign out user ${user?.email}: ${success}`)
                }
            } catch (err) {
                if (err instanceof BetterAuthError) {
                    setError(err.message);
                }
            }
            setLoading(false);
        }
    }

    const changeEmail = async (newEmail: string) => {

    }

    const changePassword = async (newPassword: string, oldPassword: string) => {

    }

    const deleteUser = async (password: string) => {

    }

    const resetError = () => setError(undefined);

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
        }}>
            {children}
        </AuthContext.Provider>
    )
}