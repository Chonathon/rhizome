import {ArtistNodeLimitType, Genre, GenreClusterMode, GenreNodeLimitType, InitialGenreFilter} from "@/types";

export const DEFAULT_NODE_COUNT = 2000;
export const DEFAULT_CLUSTER_MODE: GenreClusterMode[] = ['subgenre'];
export const DEFAULT_GENRE_LIMIT_TYPE: GenreNodeLimitType = 'artistCount';
export const DEFAULT_ARTIST_LIMIT_TYPE: ArtistNodeLimitType = 'listeners';

export const MAX_NODES = 2000;
export const NODE_AMOUNT_PRESETS = [2000, 1000, 500, 200, 100, 50];

export const PARENT_FIELD_MAP: {
    subgenre: "subgenres";
    influence: "influenced_genres";
    fusion: "fusion_genres";
} = {
    subgenre: 'subgenres',
    influence: 'influenced_genres',
    fusion: 'fusion_genres',
}
export const CHILD_FIELD_MAP: {
    subgenre: 'subgenre_of',
    influence: 'influenced_by',
    fusion: 'fusion_of'
} = {
    subgenre: 'subgenre_of',
    influence: 'influenced_by',
    fusion: 'fusion_of',
}

export const SINGLETON_PARENT_GENRE: Genre = {
    id: 'singletonparentgenre',
    name: 'no relationships',
    rootGenres: [],
    subgenres: [],
    subgenre_of: [],
    fusion_genres: [],
    fusion_of: [],
    influenced_genres: [],
    influenced_by: [],
    specificRootGenres: [],
    artistCount: 0,
}

export const TOP_ARTISTS_TO_FETCH = 8;

export const BAD_DATA_DESC_LIMIT = 150;

export const SEARCH_DEBOUNCE_MS = 500;

export const GENRE_FILTER_CLUSTER_MODE: GenreClusterMode[] = ['subgenre'];
export const EMPTY_GENRE_FILTER_OBJECT: InitialGenreFilter = {
    genre: undefined,
    isRoot: true,
    parents: {},
};

export const MAX_YTID_QUEUE_SIZE = 500;

export const DEFAULT_DARK_NODE_COLOR = '#8a80ff';
export const DEFAULT_LIGHT_NODE_COLOR = '#4a4a4a';
// Tailwind default color palette (lighter/less saturated variants)
// Uses -300 and -400 shades across hues for good visibility on dark backgrounds
// while staying softer than 500/600.
export const CLUSTER_COLORS = [
    // 300 shades
    "#fca5a5", // red-300
    "#fdba74", // orange-300
    "#fcd34d", // amber-300
    "#fde047", // yellow-300
    "#bef264", // lime-300
    "#86efac", // green-300
    "#6ee7b7", // emerald-300
    "#5eead4", // teal-300
    "#67e8f9", // cyan-300
    "#7dd3fc", // sky-300
    "#93c5fd", // blue-300
    "#a5b4fc", // indigo-300
    "#c4b5fd", // violet-300
    "#d8b4fe", // purple-300
    "#f0abfc", // fuchsia-300
    "#f9a8d4", // pink-300
    "#fda4af", // rose-300

    // 400 shades (slightly stronger, still soft)
    "#f87171", // red-400
    "#fb923c", // orange-400
    "#fbbf24", // amber-400
    "#facc15", // yellow-400
    "#a3e635", // lime-400
    "#4ade80", // green-400
    "#34d399", // emerald-400
    "#2dd4bf", // teal-400
    "#22d3ee", // cyan-400
    "#38bdf8", // sky-400
    "#60a5fa", // blue-400
    "#818cf8", // indigo-400
    "#a78bfa", // violet-400
    "#c084fc", // purple-400
    "#e879f9", // fuchsia-400
    "#f472b6", // pink-400
    "#fb7185", // rose-400
];

export const SINGLETON_PARENT_COLOR = "#c4b5fd"; // violet-300 (arbitrary)