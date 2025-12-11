import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins";
import {serverUrl} from "@/lib/utils";

const url = serverUrl();

export const authClient = createAuthClient({
    baseURL: url,
    plugins: [inferAdditionalFields({
        user: {
            appAccess: {
                type: "string",
                // input: false,
            }
        }
    })],
});

export type Session = typeof authClient.$Infer.Session