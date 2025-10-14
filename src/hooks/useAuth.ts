import {authClient} from "@/lib/auth-client";
import {useEffect, useState} from "react";
import {Social} from "@/types";
import {BetterAuthError} from "better-auth";

const useAuth = () => {
    const [userID, setUserID] = useState<string>();
    const [userName, setUserName] = useState<string>();
    const [userEmail, setUserEmail] = useState<string>();
    const [authError, setAuthError] = useState<string>();
    const [authLoading, setAuthLoading] = useState(false);

    const signIn = async (email: string, password: string) => {
        resetAuthError();
        setAuthLoading(true);
        const { data, error } = await authClient.signIn.email({
                email,
                password,
            }, {
                onError: (ctx) => {
                    setAuthError(ctx.error.message);
                },
        });
        if (data) {
            setUserID(data.user.id);
            setUserName(data.user.name);
            setUserEmail(data.user.email);
        }
        setAuthLoading(false);
        return { data, error };
    }

    const signInSocial = async (social: Social) => {
        resetAuthError();
        setAuthLoading(true);
        const { data, error } = await authClient.signIn.social({
            provider: social,
        }, {
            onError: (ctx) => {
                setAuthError(ctx.error.message);
            },
            onSuccess: (ctx) => {
                console.log('ctx', ctx)

            }

        });
        console.log('data' , data);
        if (data) {

        }
        setAuthLoading(false);
        return { data, error };
    }

    const signUp = async (email: string, password: string, name: string) => {
        resetAuthError();
        setAuthLoading(true);
        const { data, error } = await authClient.signUp.email({
            email,
            password,
            name,
        }, {
            onError: (ctx) => {
                setAuthError(ctx.error.message);
            },
        });
        if (data) {
            setUserID(data.user.id);
            setUserName(data.user.name);
            setUserEmail(data.user.email);
        }
        setAuthLoading(false);
        return { data, error };
    }

    const signOut = async () => {
        resetAuthError();
        setAuthLoading(true);
        try {
            await authClient.signOut();
            setUserID(undefined);
            setUserName(undefined);
            setUserEmail(undefined);
        } catch (error) {
            if (error instanceof BetterAuthError) {
                setAuthError(error.message);
            }
        }
        setAuthLoading(false);
    }

    const changeEmail = async (newEmail: string) => {
        resetAuthError();
        setAuthLoading(true);
        try {
            await authClient.changeEmail({
                newEmail
            });
        } catch (error) {
            if (error instanceof BetterAuthError) {
                setAuthError(error.message);
            }
        }
    }

    const changePassword = async (newPassword: string, currentPassword: string) => {
        resetAuthError();
        setAuthLoading(true);
        const { data, error } = await authClient.changePassword({
            newPassword,
            currentPassword,
            revokeOtherSessions: true,
        }, {
            onError: (ctx) => {
                setAuthError(ctx.error.message);
            }
        });
        setAuthLoading(false);
        return { data, error };
    }

    const deleteUser = async (password: string) => {
        resetAuthError();
        setAuthLoading(true);
        try {
            await authClient.deleteUser({
                password
            });
        } catch (error) {
            if (error instanceof BetterAuthError) {
                setAuthError(error.message);
            }
        }
        setAuthLoading(false);
    }

    const {
        data: session,
        isPending: isSessionLoading,
        error: sessionError,
        refetch: refetchSession,
    } = authClient.useSession();

    const resetAuthError = () => setAuthError(undefined);

    // Uncomment and put in credentials of an account to do stuff as a signed in user
    // useEffect(() => {
    //     signIn('', '');
    // }, []);

    // useEffect(() => {
    //     signIn('bpricedev@gmail.com', 'deathmetal');
    // }, []);

    return {
        userID,
        userName,
        userEmail,
        signIn,
        signInSocial,
        signUp,
        signOut,
        changeEmail,
        changePassword,
        deleteUser,
        session,
        isSessionLoading,
        sessionError,
        refetchSession,
        authLoading,
        authError,
        resetAuthError,
    }
}

export default useAuth;