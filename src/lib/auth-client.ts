import { createAuthClient } from "better-auth/react"
import {serverUrl} from "@/lib/utils";

const url = serverUrl();

export const authClient = createAuthClient({
    baseURL: url,
});