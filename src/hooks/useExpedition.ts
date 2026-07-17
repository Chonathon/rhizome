import { useCallback, useMemo, useReducer } from "react";
import { Artist, ExpeditionExpansion, ExpeditionNode, NodeLink } from "@/types";
import {
    EXPEDITION_EXPAND_LIMIT,
    EXPEDITION_NODE_CAP,
    EXPEDITION_PRUNE_TARGET,
    EXPEDITION_SEED_LIMIT,
} from "@/constants";

// Note: the similarArtists view is conceptually a 1-hop expedition with no incremental
// expansion — a future refactor could reimplement createSimilarArtistGraph on top of this hook.

export interface ExpeditionState {
    seed: Artist | null;
    nodes: Map<string, ExpeditionNode>;
    links: NodeLink[];
    expandingId: string | null;
    expansionCount: number;
    history: ExpeditionExpansion[];
    // Logical clock for lastTouched — deterministic, unlike Date.now()
    touchCounter: number;
}

export const INITIAL_EXPEDITION_STATE: ExpeditionState = {
    seed: null,
    nodes: new Map(),
    links: [],
    expandingId: null,
    expansionCount: 0,
    history: [],
    touchCounter: 0,
};

export type ExpeditionAction =
    | { type: 'start-loaded'; seed: Artist; artists: Artist[]; links: NodeLink[] }
    | { type: 'expand-start'; id: string }
    | { type: 'expand-loaded'; parentId: string; artists: Artist[]; links: NodeLink[]; protectedIds: Set<string> }
    | { type: 'expand-failed' }
    | { type: 'undo' }
    | { type: 'reset' };

const linkKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// Keep links whose endpoints both exist, deduped order-independently
const sanitizeLinks = (links: NodeLink[], nodeIds: Set<string>): NodeLink[] => {
    const seen = new Set<string>();
    return links.filter(link => {
        if (link.source === link.target) return false;
        if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return false;
        const key = linkKey(link.source, link.target);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export function expeditionReducer(state: ExpeditionState, action: ExpeditionAction): ExpeditionState {
    switch (action.type) {
        case 'reset':
            return INITIAL_EXPEDITION_STATE;

        case 'start-loaded': {
            const { seed, artists, links } = action;
            let touch = 0;
            const nodes = new Map<string, ExpeditionNode>();
            nodes.set(seed.id, {
                artist: { ...seed, hopDistance: 0 },
                status: 'visited',
                addedAtExpansion: 0,
                lastTouched: ++touch,
            });
            for (const artist of artists) {
                if (nodes.has(artist.id)) continue;
                nodes.set(artist.id, {
                    artist: { ...artist, hopDistance: 1 },
                    status: 'frontier',
                    expandedFrom: seed.id,
                    addedAtExpansion: 0,
                    lastTouched: ++touch,
                });
            }
            const nodeIds = new Set(nodes.keys());
            const merged = sanitizeLinks(links, nodeIds);
            // Guarantee a trail edge from the seed to every neighbor the server didn't link
            const linkedToSeed = new Set<string>();
            for (const l of merged) {
                if (l.source === seed.id) linkedToSeed.add(l.target);
                if (l.target === seed.id) linkedToSeed.add(l.source);
            }
            for (const id of nodeIds) {
                if (id !== seed.id && !linkedToSeed.has(id)) {
                    merged.push({ source: seed.id, target: id, linkType: 'similar' });
                }
            }
            return {
                seed,
                nodes,
                links: merged,
                expandingId: null,
                expansionCount: 0,
                history: [],
                touchCounter: touch,
            };
        }

        case 'expand-start':
            return { ...state, expandingId: action.id };

        case 'expand-failed':
            return { ...state, expandingId: null };

        case 'expand-loaded': {
            const { parentId, artists, links, protectedIds } = action;
            const parent = state.nodes.get(parentId);
            if (!parent || !state.seed) return { ...state, expandingId: null };

            let touch = state.touchCounter;
            const nodes = new Map(state.nodes);
            const parentPrevStatus = parent.status;
            const parentHop = parent.artist.hopDistance ?? 0;
            const expansionSeq = state.expansionCount + 1;
            nodes.set(parentId, { ...parent, status: 'visited', lastTouched: ++touch });

            const addedNodeIds: string[] = [];
            for (const artist of artists) {
                const existing = nodes.get(artist.id);
                if (existing) {
                    // Re-encountered node: keep the original (smaller) hopDistance, just refresh recency
                    nodes.set(artist.id, { ...existing, lastTouched: ++touch });
                    continue;
                }
                nodes.set(artist.id, {
                    artist: { ...artist, hopDistance: parentHop + 1 },
                    status: 'frontier',
                    expandedFrom: parentId,
                    addedAtExpansion: expansionSeq,
                    lastTouched: ++touch,
                });
                addedNodeIds.push(artist.id);
            }

            // Merge new links (including densification links between already-present nodes)
            const nodeIds = new Set(nodes.keys());
            const existingKeys = new Set(state.links.map(l => linkKey(l.source, l.target)));
            const addedLinks: NodeLink[] = [];
            for (const link of sanitizeLinks(links, nodeIds)) {
                const key = linkKey(link.source, link.target);
                if (existingKeys.has(key)) continue;
                existingKeys.add(key);
                addedLinks.push(link);
            }
            // Guarantee a trail edge from the parent to each newly added child
            for (const childId of addedNodeIds) {
                const key = linkKey(parentId, childId);
                if (!existingKeys.has(key)) {
                    existingKeys.add(key);
                    addedLinks.push({ source: parentId, target: childId, linkType: 'similar' });
                }
            }

            let mergedLinks = [...state.links, ...addedLinks];

            // Prune least-recently-relevant frontier nodes when over the cap
            if (nodes.size > EXPEDITION_NODE_CAP) {
                const justAdded = new Set(addedNodeIds);
                const candidates = [...nodes.values()]
                    .filter(n =>
                        n.status === 'frontier' &&
                        n.artist.id !== state.seed!.id &&
                        !justAdded.has(n.artist.id) &&
                        !protectedIds.has(n.artist.id)
                    )
                    .sort((a, b) =>
                        a.lastTouched - b.lastTouched ||
                        (b.artist.hopDistance ?? 0) - (a.artist.hopDistance ?? 0)
                    );
                for (const candidate of candidates) {
                    if (nodes.size <= EXPEDITION_PRUNE_TARGET) break;
                    nodes.delete(candidate.artist.id);
                }
                const remainingIds = new Set(nodes.keys());
                mergedLinks = mergedLinks.filter(l => remainingIds.has(l.source) && remainingIds.has(l.target));
            }

            // A dead-end expansion (nothing added) still marks the parent visited but isn't undoable
            const history = addedNodeIds.length > 0 || addedLinks.length > 0
                ? [...state.history, { parentId, addedNodeIds, addedLinks, parentPrevStatus }]
                : state.history;

            return {
                ...state,
                nodes,
                links: mergedLinks,
                expandingId: null,
                expansionCount: expansionSeq,
                history,
                touchCounter: touch,
            };
        }

        case 'undo': {
            const record = state.history[state.history.length - 1];
            if (!record) return state;

            const nodes = new Map(state.nodes);
            // Only remove additions that survived any later pruning
            const removed = new Set<string>();
            for (const id of record.addedNodeIds) {
                if (nodes.delete(id)) removed.add(id);
            }
            const parent = nodes.get(record.parentId);
            if (parent) {
                nodes.set(record.parentId, { ...parent, status: record.parentPrevStatus });
            }
            const removedLinkKeys = new Set(record.addedLinks.map(l => linkKey(l.source, l.target)));
            const remainingIds = new Set(nodes.keys());
            const links = state.links.filter(l =>
                !removedLinkKeys.has(linkKey(l.source, l.target)) &&
                remainingIds.has(l.source) && remainingIds.has(l.target)
            );

            return {
                ...state,
                nodes,
                links,
                history: state.history.slice(0, -1),
                expansionCount: Math.max(0, state.expansionCount - 1),
            };
        }

        default:
            return state;
    }
}

type FetchHopArtistsFn = (
    artistIds: string[],
    hopDepth: number,
    limit?: number,
    genres?: string[],
) => Promise<{ artists: Artist[]; links: NodeLink[] }>;

const useExpedition = (
    fetchHopArtists: FetchHopArtistsFn,
    getProtectedIds: () => Set<string>,
) => {
    const [state, dispatch] = useReducer(expeditionReducer, INITIAL_EXPEDITION_STATE);

    const expeditionArtists = useMemo(
        () => [...state.nodes.values()].map(n => n.artist),
        [state.nodes],
    );

    const visitedIds = useMemo(() => {
        const ids = new Set<string>();
        for (const n of state.nodes.values()) {
            if (n.status === 'visited') ids.add(n.artist.id);
        }
        return ids;
    }, [state.nodes]);

    const frontierIds = useMemo(() => {
        const ids = new Set<string>();
        for (const n of state.nodes.values()) {
            if (n.status === 'frontier') ids.add(n.artist.id);
        }
        return ids;
    }, [state.nodes]);

    // Trail links: the expandedFrom chain of visited nodes, as order-independent "a|b" keys
    const trailLinkKeys = useMemo(() => {
        const keys = new Set<string>();
        for (const n of state.nodes.values()) {
            if (n.status === 'visited' && n.expandedFrom && state.nodes.has(n.expandedFrom)) {
                keys.add(linkKey(n.artist.id, n.expandedFrom));
            }
        }
        return keys;
    }, [state.nodes]);

    const startExpedition = useCallback(async (seed: Artist): Promise<boolean> => {
        dispatch({ type: 'reset' });
        const result = await fetchHopArtists([seed.id], 1, EXPEDITION_SEED_LIMIT);
        const neighbors = result.artists.filter(a => a.id !== seed.id);
        if (!neighbors.length) return false;
        dispatch({ type: 'start-loaded', seed, artists: neighbors, links: result.links });
        return true;
    }, [fetchHopArtists]);

    const expandNode = useCallback(async (artist: Artist) => {
        if (state.expandingId) return;
        const node = state.nodes.get(artist.id);
        if (!node || node.status === 'visited') return;
        dispatch({ type: 'expand-start', id: artist.id });
        const result = await fetchHopArtists([artist.id], 1, EXPEDITION_EXPAND_LIMIT);
        dispatch({
            type: 'expand-loaded',
            parentId: artist.id,
            artists: result.artists.filter(a => a.id !== artist.id),
            links: result.links,
            protectedIds: getProtectedIds(),
        });
    }, [state.expandingId, state.nodes, fetchHopArtists, getProtectedIds]);

    const undoLastExpansion = useCallback(() => dispatch({ type: 'undo' }), []);
    const resetExpedition = useCallback(() => dispatch({ type: 'reset' }), []);

    return {
        seed: state.seed,
        expeditionNodes: state.nodes,
        expeditionArtists,
        expeditionLinks: state.links,
        visitedIds,
        frontierIds,
        trailLinkKeys,
        expandingId: state.expandingId,
        expansionCount: state.expansionCount,
        canUndo: state.history.length > 0,
        startExpedition,
        expandNode,
        undoLastExpansion,
        resetExpedition,
    };
};

export default useExpedition;
