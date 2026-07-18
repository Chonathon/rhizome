import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { Artist } from "@/types";
import { serverUrl } from "@/lib/utils";
import { JOURNEY_CANDIDATE_POOL, JOURNEY_MAX_PATH_LENGTH } from "@/constants";

const url = serverUrl();

export const JOURNEY_URL_PARAM = "journey";
const JOURNEY_ID_SEPARATOR = ",";

// How strongly next-stop selection favors artists with fewer listeners than the
// current stop. 0 = uniform, 1 = fully proportional to the listener ratio.
const UNDERDOG_EXPONENT = 0.6;
// Clamp weights so one obscure artist doesn't monopolize the draw and giants still appear occasionally.
const MAX_WEIGHT = 25;
const MIN_WEIGHT = 0.05;

/** Read the journey path (artist IDs, in visit order) from the current URL. */
export const parseJourneyParam = (search: string): string[] => {
    const raw = new URLSearchParams(search).get(JOURNEY_URL_PARAM);
    if (!raw) return [];
    return raw
        .split(JOURNEY_ID_SEPARATOR)
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, JOURNEY_MAX_PATH_LENGTH);
};

// Writes/clears the journey param in place (replaceState) so the path is shareable
// without adding history entries. Preserves other params and history.state —
// useUrlState keeps its historyIndex there.
const writeJourneyParam = (ids: string[]) => {
    const params = new URLSearchParams(window.location.search);
    if (ids.length) {
        params.set(JOURNEY_URL_PARAM, ids.join(JOURNEY_ID_SEPARATOR));
    } else {
        params.delete(JOURNEY_URL_PARAM);
    }
    const search = params.toString();
    const newUrl = search
        ? `${window.location.pathname}?${search}`
        : window.location.pathname;
    window.history.replaceState(window.history.state, "", newUrl);
};

// Weighted sample without replacement into a ranked order, deliberately favoring
// artists with fewer listeners than the current stop ("low listeners relative to
// the anchor"). The first entry is the proposed next stop; shuffling walks the rest.
const rankWeightedUnderdogs = (candidates: Artist[], anchor: Artist, count: number): Artist[] => {
    const anchorListeners = Math.max(1, anchor.listeners || 1);
    const pool = candidates.map((artist) => {
        const listeners = Math.max(1, artist.listeners || 1);
        const weight = Math.min(
            MAX_WEIGHT,
            Math.max(MIN_WEIGHT, Math.pow(anchorListeners / listeners, UNDERDOG_EXPONENT)),
        );
        return { artist, weight };
    });

    const picked: Artist[] = [];
    while (picked.length < count && pool.length) {
        const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * total;
        let index = pool.length - 1;
        for (let i = 0; i < pool.length; i++) {
            roll -= pool[i].weight;
            if (roll <= 0) {
                index = i;
                break;
            }
        }
        picked.push(pool[index].artist);
        pool.splice(index, 1);
    }
    return picked;
};

/**
 * State for Radio mode (guided journeys): an on-rails walk through the artist
 * graph. Holds the visited path and a single proposed next stop drawn from a
 * ranked candidate pool weighted toward lesser-known similar artists (shuffle
 * cycles through the pool). The path is mirrored into the URL so a journey is
 * shareable via the existing URL-state system.
 *
 * Side effects (playing tracks, opening the bio card) are orchestrated by the
 * caller — this hook only owns journey data.
 */
export function useJourney() {
    const [journeyActive, setJourneyActive] = useState(false);
    const [journeyPath, setJourneyPath] = useState<Artist[]>([]);
    const [journeyCandidates, setJourneyCandidates] = useState<Artist[]>([]);
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [journeyOptionsLoading, setJourneyOptionsLoading] = useState(false);
    // Guards against a slow candidates fetch landing after the journey moved on
    const optionsRequestRef = useRef(0);

    const journeyNextStop = journeyCandidates.length
        ? journeyCandidates[candidateIndex % journeyCandidates.length]
        : undefined;

    const loadCandidates = useCallback(async (stop: Artist, visitedIds: Set<string>) => {
        const request = ++optionsRequestRef.current;
        setJourneyCandidates([]);
        setCandidateIndex(0);
        setJourneyOptionsLoading(true);
        let candidates: Artist[] = [];
        try {
            const response = await axios.get(`${url}/artists/fetch/similar/${stop.id}`);
            const seen = new Set<string>();
            candidates = (response.data as Artist[]).filter((artist) => {
                if (!artist?.id || visitedIds.has(artist.id) || seen.has(artist.id)) return false;
                seen.add(artist.id);
                return true;
            });
        } catch {
            candidates = [];
        }
        if (request !== optionsRequestRef.current) return;
        setJourneyCandidates(rankWeightedUnderdogs(candidates, stop, JOURNEY_CANDIDATE_POOL));
        setJourneyOptionsLoading(false);
    }, []);

    const startJourney = useCallback((anchor: Artist) => {
        setJourneyActive(true);
        setJourneyPath([anchor]);
        writeJourneyParam([anchor.id]);
        loadCandidates(anchor, new Set([anchor.id]));
    }, [loadCandidates]);

    const chooseNextStop = useCallback((stop: Artist) => {
        if (journeyPath.some((artist) => artist.id === stop.id) || journeyPath.length >= JOURNEY_MAX_PATH_LENGTH) {
            return;
        }
        const nextPath = [...journeyPath, stop];
        setJourneyPath(nextPath);
        writeJourneyParam(nextPath.map((artist) => artist.id));
        loadCandidates(stop, new Set(nextPath.map((artist) => artist.id)));
    }, [journeyPath, loadCandidates]);

    /** Propose a different next stop from the remaining candidate pool. */
    const shuffleNextStop = useCallback(() => {
        if (journeyCandidates.length > 1) {
            setCandidateIndex((prev) => prev + 1);
        }
    }, [journeyCandidates.length]);

    /** Restore a journey (e.g. from a shared URL) without refetching the visited stops. */
    const restoreJourney = useCallback((path: Artist[]) => {
        if (!path.length) return;
        setJourneyActive(true);
        setJourneyPath(path);
        writeJourneyParam(path.map((artist) => artist.id));
        loadCandidates(path[path.length - 1], new Set(path.map((artist) => artist.id)));
    }, [loadCandidates]);

    const endJourney = useCallback(() => {
        optionsRequestRef.current++;
        setJourneyActive(false);
        setJourneyPath([]);
        setJourneyCandidates([]);
        setCandidateIndex(0);
        setJourneyOptionsLoading(false);
        writeJourneyParam([]);
    }, []);

    return {
        journeyActive,
        journeyPath,
        journeyNextStop,
        journeyOptionsLoading,
        startJourney,
        chooseNextStop,
        shuffleNextStop,
        restoreJourney,
        endJourney,
    };
}

export default useJourney;
