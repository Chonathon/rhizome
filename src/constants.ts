import {
    ArtistNodeLimitType,
    Genre,
    GenreClusterMode,
    GenreNodeLimitType,
    InitialGenreFilter,
    PlayerType, Preferences, Theme
} from "@/types";

export const PHASE_VERSION = `${import.meta.env.VITE_PRODUCT_PHASE}-${import.meta.env.VITE_PRODUCT_VERSION}`;
export const DEFAULT_NODE_COUNT = 2000;
export const DEFAULT_CLUSTER_MODE: GenreClusterMode[] = ['subgenre'];
export const DEFAULT_GENRE_LIMIT_TYPE: GenreNodeLimitType = 'artistCount';
export const DEFAULT_ARTIST_LIMIT_TYPE: ArtistNodeLimitType = 'listeners';
export const DEFAULT_PLAYER: PlayerType = 'youtube';

export const MAX_NODES = 2000;
export const NODE_AMOUNT_PRESETS = [5000, 3000, 2000, 1000, 500, 200, 100, 50];

export const SERVER_PRODUCTION_URL = 'https://rhizome-server-production.up.railway.app';
export const SERVER_DEVELOPMENT_URL = 'https://rhizome-server-development.up.railway.app';
export const CLIENT_DEPLOYMENT_URL = 'https://www.rhizome.fyi';

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
export const FEEDBACK_TEXT_LIMIT = 500;

export const SEARCH_DEBOUNCE_MS = 500;

export const ALPHA_SURVEY_TIME_MS = 5 * 60 * 1000;
export const ALPHA_SURVEY_ADDED_ARTISTS = 3;

export const GENRE_FILTER_CLUSTER_MODE: GenreClusterMode[] = ['subgenre'];
export const EMPTY_GENRE_FILTER_OBJECT: InitialGenreFilter = {
    genre: undefined,
    isRoot: true,
    parents: {},
};

export const UNREGISTERED_USER_ID = 'unregistered';

export const MAX_YTID_QUEUE_SIZE = 200;

export const DEFAULT_THEME: Theme = 'system';
export const DEFAULT_PREFERENCES: Preferences = {theme: DEFAULT_THEME, player: DEFAULT_PLAYER, enableGraphCards: true, previewTrigger: 'modifier'};
export const DEFAULT_DARK_NODE_COLOR = '#8a80ff';
export const DEFAULT_LIGHT_NODE_COLOR = '#4a4a4a';
// Generates distinct cluster colors using the golden angle (137.5°) to maximize
// hue separation between adjacent indices. Supports unlimited colors for legends.
// Returns hex format for compatibility with opacity suffixes used in graph rendering.
export const getClusterColor = (index: number): string => {
    const hue = (index * 137.5) % 360;
    const saturation = 85;
    const lightness = 70 + (index % 3) * 5; // 70%, 75%, 80% range
    return hslToHex(hue, saturation, lightness);
};

const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

export const SINGLETON_PARENT_COLOR = "#c4b5fd"; // violet-300 (arbitrary)
