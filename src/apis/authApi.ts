import {authClient} from "@/lib/auth-client";
import {Social} from "@/types";
import {BetterAuthError} from "better-auth";

export const signInUser = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
        email,
        password,
    });
    return { data, error };
}

export const signInSocialUser = async (social: Social) => {
    const { data, error } = await authClient.signIn.social({
        provider: social,
    }, {
        onSuccess: (ctx) => {
            console.log('ctx', ctx)

        }

    });
    console.log('data' , data);
    return { data, error };
}

export const signUpUser = async (email: string, password: string, name: string) => {
    const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
    });
    return { data, error };
}

export const signOutUser = async () => {
    try {
        await authClient.signOut();
        return true;
    } catch (error) {
        if (error instanceof BetterAuthError) {
            return error;
        }
    }
    return false;
}

export const changeUserEmail = async (newEmail: string) => {
    try {
        await authClient.changeEmail({
            newEmail
        });
        return true;
    } catch (error) {
        if (error instanceof BetterAuthError) {
            return error;
        }
    }
    return false;
}

export const changeUserPassword = async (newPassword: string, currentPassword: string) => {
    const { data, error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
    });
    return { data, error };
}

export const deleteUser = async (password: string) => {
    try {
        await authClient.deleteUser({
            password
        });
        return true;
    } catch (error) {
        if (error instanceof BetterAuthError) {
            return error;
        }
    }
    return false;
}