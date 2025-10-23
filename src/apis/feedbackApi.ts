import {Feedback} from "@/types";
import axios, {AxiosError} from "axios";
import {serverUrl} from "@/lib/utils";

const url = serverUrl();

export const submitFeedback = async (feedback: Feedback) => {
    try {
        await axios.post(`${url}/users/feedback`, { feedback });
        return true;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error);
            return false;
        }
    }
    return false;
}