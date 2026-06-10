import {envBoolean, serverUrl} from "@/lib/utils";
import {useEffect, useState} from "react";
import {Artist, Genre} from "@/types";
import axios, {AxiosError} from "axios";

const url = serverUrl();

const useSearch = (query?: string) => {
    const [searchResults, setSearchResults] = useState<Artist[] | Genre[]>([]);
    const [searchError, setSearchError] = useState<AxiosError>();
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        const trimmed = query?.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSearchError(undefined);
            setSearchLoading(false);
            return;
        }
        const controller = new AbortController();
        const search = async () => {
            setSearchLoading(true);
            try {
                const response = await axios.get(`${url}/search/${encodeURIComponent(trimmed)}`, {
                    signal: controller.signal,
                });
                setSearchResults(response.data);
                setSearchError(undefined);
                setSearchLoading(false);
            } catch (err) {
                if (axios.isCancel(err)) return;
                if (err instanceof AxiosError) {
                    setSearchError(err);
                }
                setSearchLoading(false);
            }
        }
        search();
        return () => controller.abort();
    }, [query]);

    return { searchResults, searchLoading, searchError };
}

export default useSearch;
