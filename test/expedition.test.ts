import { describe, expect, it } from "vitest";
import {
    expeditionReducer,
    INITIAL_EXPEDITION_STATE,
    type ExpeditionState,
} from "@/hooks/useExpedition";
import { EXPEDITION_NODE_CAP } from "@/constants";
import { Artist, NodeLink } from "@/types";

const makeArtist = (id: string): Artist => ({
    id,
    name: `Artist ${id}`,
    tags: [],
    genres: [],
    listeners: 0,
    playcount: 0,
    similar: [],
    bio: { link: "", summary: "", content: "" },
    noMBID: false,
});

const link = (source: string, target: string): NodeLink => ({ source, target, linkType: "similar" });

const linkKeys = (state: ExpeditionState) =>
    new Set(state.links.map(l => (l.source < l.target ? `${l.source}|${l.target}` : `${l.target}|${l.source}`)));

const start = (neighborIds: string[], links: NodeLink[] = []): ExpeditionState =>
    expeditionReducer(INITIAL_EXPEDITION_STATE, {
        type: "start-loaded",
        seed: makeArtist("seed"),
        artists: neighborIds.map(makeArtist),
        links,
    });

describe("expeditionReducer start-loaded", () => {
    it("marks the seed visited and neighbors frontier with hop distances", () => {
        const state = start(["a", "b"], [link("seed", "a")]);
        expect(state.seed?.id).toBe("seed");
        expect(state.nodes.get("seed")?.status).toBe("visited");
        expect(state.nodes.get("seed")?.artist.hopDistance).toBe(0);
        expect(state.nodes.get("a")?.status).toBe("frontier");
        expect(state.nodes.get("a")?.artist.hopDistance).toBe(1);
        expect(state.nodes.get("b")?.expandedFrom).toBe("seed");
    });

    it("synthesizes a seed trail edge for neighbors the server did not link", () => {
        const state = start(["a", "b"], [link("seed", "a")]);
        expect(linkKeys(state)).toContain("b|seed");
    });

    it("drops links pointing outside the loaded set and dedupes pairs", () => {
        const state = start(["a"], [link("seed", "a"), link("a", "seed"), link("a", "ghost")]);
        expect(state.links).toHaveLength(1);
    });
});

describe("expeditionReducer expand-loaded", () => {
    it("marks the parent visited and adds children as frontier one hop further", () => {
        let state = start(["a", "b"]);
        state = expeditionReducer(state, {
            type: "expand-loaded",
            parentId: "a",
            artists: [makeArtist("x"), makeArtist("b")],
            links: [link("a", "x")],
            protectedIds: new Set(),
        });
        expect(state.nodes.get("a")?.status).toBe("visited");
        expect(state.nodes.get("x")?.status).toBe("frontier");
        expect(state.nodes.get("x")?.artist.hopDistance).toBe(2);
        expect(state.nodes.get("x")?.expandedFrom).toBe("a");
        // Re-encountered node keeps its original, smaller hop distance
        expect(state.nodes.get("b")?.artist.hopDistance).toBe(1);
        expect(state.expansionCount).toBe(1);
        expect(state.history).toHaveLength(1);
    });

    it("synthesizes a parent trail edge for unlinked children", () => {
        let state = start(["a"]);
        state = expeditionReducer(state, {
            type: "expand-loaded",
            parentId: "a",
            artists: [makeArtist("x")],
            links: [],
            protectedIds: new Set(),
        });
        expect(linkKeys(state)).toContain("a|x");
    });

    it("treats a dead-end expansion as visited but not undoable", () => {
        let state = start(["a"]);
        state = expeditionReducer(state, {
            type: "expand-loaded",
            parentId: "a",
            artists: [],
            links: [],
            protectedIds: new Set(),
        });
        expect(state.nodes.get("a")?.status).toBe("visited");
        expect(state.history).toHaveLength(0);
        expect(state.expandingId).toBeNull();
    });
});

describe("expeditionReducer undo", () => {
    it("removes the last expansion's nodes and links and restores the parent status", () => {
        let state = start(["a"]);
        state = expeditionReducer(state, {
            type: "expand-loaded",
            parentId: "a",
            artists: [makeArtist("x")],
            links: [link("a", "x")],
            protectedIds: new Set(),
        });
        state = expeditionReducer(state, { type: "undo" });
        expect(state.nodes.has("x")).toBe(false);
        expect(state.nodes.get("a")?.status).toBe("frontier");
        expect(linkKeys(state)).not.toContain("a|x");
        expect(state.history).toHaveLength(0);
        expect(state.expansionCount).toBe(0);
    });
});

describe("expeditionReducer pruning", () => {
    const bigExpand = (state: ExpeditionState, parentId: string, count: number, prefix: string) =>
        expeditionReducer(state, {
            type: "expand-loaded",
            parentId,
            artists: Array.from({ length: count }, (_, i) => makeArtist(`${prefix}${i}`)),
            links: [],
            protectedIds: new Set(["n5"]),
        });

    it("evicts stale frontier nodes over the cap but never seed/visited/protected/just-added", () => {
        const neighbors = Array.from({ length: 30 }, (_, i) => `n${i}`);
        let state = start(neighbors);
        state = bigExpand(state, "n1", 280, "x");
        expect(state.nodes.size).toBeLessThanOrEqual(EXPEDITION_NODE_CAP);
        // Stale initial frontier evicted...
        expect(state.nodes.has("n0")).toBe(false);
        // ...but the seed, the visited parent, the protected node, and new nodes survive
        expect(state.nodes.has("seed")).toBe(true);
        expect(state.nodes.get("n1")?.status).toBe("visited");
        expect(state.nodes.has("n5")).toBe(true);
        expect(state.nodes.has("x0")).toBe(true);
        // No dangling links after eviction
        for (const l of state.links) {
            expect(state.nodes.has(l.source)).toBe(true);
            expect(state.nodes.has(l.target)).toBe(true);
        }
    });

    it("undo after a prune does not resurrect pruned nodes", () => {
        const neighbors = Array.from({ length: 30 }, (_, i) => `n${i}`);
        let state = start(neighbors);
        state = bigExpand(state, "n1", 280, "x");
        expect(state.nodes.has("n0")).toBe(false);
        state = expeditionReducer(state, { type: "undo" });
        expect(state.nodes.has("x0")).toBe(false);
        expect(state.nodes.has("n0")).toBe(false);
        expect(state.nodes.get("n1")?.status).toBe("frontier");
    });
});
