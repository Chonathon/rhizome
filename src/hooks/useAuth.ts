import {authClient} from "@/lib/auth-client";
import {useEffect, useState} from "react";

const useAuth = () => {
    const [userID, setUserID] = useState<string>();
    const [userName, setUserName] = useState<string>();
    const [userEmail, setUserEmail] = useState<string>();
    const [authError, setAuthError] = useState();
    const signIn = async (email: string, password: string) => {
        const { data, error } = await authClient.signIn.email({
            email,
            password,
        }, {
            //callbacks
        });
        if (data) {
            setUserID(data.user.id);
            setUserName(data.user.name);
            setUserEmail(data.user.email);
        }
        return { data, error };
    }

    const signUp = async (email: string, password: string, name: string) => {
        const { data, error } = await authClient.signUp.email({
            email, // user email address
            password, // user password -> min 8 characters by default
            name, // user display name
        }, {
            onRequest: (ctx) => {
                //show loading
            },
            onSuccess: (ctx) => {
                //redirect to the dashboard or sign in page
            },
            onError: (ctx) => {
                // display the error message
                alert(ctx.error.message);
            },
        });
        if (data) {
            setUserID(data.user.id);
            setUserName(data.user.name);
            setUserEmail(data.user.email);
        }
        return { data, error };
    }

    const signOut = async () => {
        try {
            await authClient.signOut();
            setUserID(undefined);
            setUserName(undefined);
            setUserEmail(undefined);
        } catch (error) {
            //setAuthError(error);
        }
    }

    const {
        data: session,
        isPending: isSessionLoading,
        error: sessionError,
        refetch: refetchSession,
    } = authClient.useSession();

    useEffect(() => {
        //signIn()
    }, []);

    return {
        userID,
        userName,
        userEmail,
        signIn,
        signUp,
        signOut,
        session,
        isSessionLoading,
        sessionError,
        refetchSession,
    }
}

export default useAuth;