import {authClient} from "@/lib/auth-client";
import {Social} from "@/types";
import {BetterAuthError} from "better-auth";
import {clientUrl} from "@/lib/utils";
import {PHASE_VERSION} from "@/constants";

export const signInUser = async (email: string, password: string, onSuccess?: () => void, onError?: () => void) => {
    const { data, error } = await authClient.signIn.email({
        email,
        password,
    });
    return { data, error };
}

export const signInSocialUser = async (social: Social, fetchSuccess?: () => void, fetchError?: (errorMessage?: string) => void) => {
    const { data, error } = await authClient.signIn.social({
        provider: social,
        callbackURL: clientUrl(),
        additionalData: {
            appAccess: PHASE_VERSION
        }
    }, {
        onSuccess: (ctx) => {
            if (fetchSuccess) fetchSuccess();
        },
        onError: (ctx) => {
            if (fetchError) fetchError(ctx.error.message);
        }
    });
    return { data, error };
}

export const signUpUser = async (email: string, password: string, name: string) => {
    const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        appAccess: PHASE_VERSION,
        callbackURL: clientUrl(),
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

export const deleteUserAccount = async (password?: string) => {
    try {
        await authClient.deleteUser({
            password,
            callbackURL: clientUrl(),
        });
        return true;
    } catch (error) {
        if (error instanceof BetterAuthError) {
            return error;
        }
    }
    return false;
}

export const updateUserAccount = async (name?: string, image?: string, appAccess?: string) => {
    try {
        await authClient.updateUser({
            name,
            image,
            appAccess,
        });
        return true;
    } catch (error) {
        if (error instanceof BetterAuthError) {
            return error;
        }
    }
    return false;
}

export const forgotUserPassword = async (email: string) => {
    const { data, error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${clientUrl()}/reset-password`
    });
    return { data, error };
}

export const resetUserPassword = async (newPassword: string, token: string) => {
    const { data, error } = await authClient.resetPassword({
        newPassword,
        token,
    });
    return { data, error };
}