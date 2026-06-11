import {useEffect, useState} from "react";
import {BadDataReport, BasicNode, Genre, NodeLink} from "@/types";
import axios, {AxiosError} from "axios";
import {serverUrl} from "@/lib/utils";

const url = serverUrl();

function dehyphenate(name: string): string {
    return name.replace(/-/g, ' ');
}

function normalizeBasicNode(node: BasicNode): BasicNode {
    return { ...node, name: dehyphenate(node.name) };
}

function normalizeGenre(genre: Genre): Genre {
    return {
        ...genre,
        name: dehyphenate(genre.name),
        subgenre_of: genre.subgenre_of?.map(normalizeBasicNode) ?? [],
        influenced_genres: genre.influenced_genres?.map(normalizeBasicNode) ?? [],
        subgenres: genre.subgenres?.map(normalizeBasicNode) ?? [],
        fusion_genres: genre.fusion_genres?.map(normalizeBasicNode) ?? [],
        fusion_of: genre.fusion_of?.map(normalizeBasicNode) ?? [],
        influenced_by: genre.influenced_by?.map(normalizeBasicNode) ?? [],
    };
}

const useGenres = () => {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [genreLinks, setGenreLinks] = useState<NodeLink[]>([]);
    const [genreRoots, setGenreRoots] = useState<string[]>([]);
    const [genresLoading, setGenresLoading] = useState(true);
    const [genresError, setGenresError] = useState<AxiosError>();
    const [genresDataFlagLoading, setGenresDataFlagLoading] = useState(false);
    const [genresDataFlagError, setGenresDataFlagError] = useState<AxiosError>();

    const fetchGenres = async () => {
        setGenresLoading(true);
        try {
            const response = await axios.get(`${url}/genres`);
            const rootsRes = await axios.get(`${url}/genres/tree/roots`);
            setGenres(response.data.genres.map(normalizeGenre));
            setGenreLinks(response.data.links);
            setGenreRoots(rootsRes.data.rootGenres);
        } catch (err) {
            if (err instanceof AxiosError) {
                setGenresError(err);
            }
        }
        setGenresLoading(false);
    }

    useEffect(() => {
        fetchGenres();
    }, []);

    useEffect(() => {
        if (genresError) {
            console.error(genresError);
        }
    }, [genresError]);

    const flagBadGenreData = async (report: BadDataReport) => {
        setGenresDataFlagLoading(true);
        let success = false;
        try {
            const response = await axios.post(`${url}/genres/baddata/report`, { report: report });
            if (response.status === 200) {
                success = true;
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setGenresDataFlagError(err);
            }
        }
        setGenresDataFlagLoading(false);
        return success;
    }

    return {
        genres,
        genreLinks,
        genresLoading,
        genresError,
        flagBadGenreData,
        genresDataFlagLoading,
        genresDataFlagError,
        genreRoots,
        setGenres,
    };
}

export default useGenres;
