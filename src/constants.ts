import {
    ArtistClusterMode,
    ArtistNodeLimitType,
    Genre,
    GenreClusterMode,
    GenreNodeLimitType,
    InitialGenreFilter,
    ListenerTier,
    PlayerType,
    Preferences,
    Theme
} from "@/types";

export const PHASE_VERSION = `${import.meta.env.VITE_PRODUCT_PHASE}-${import.meta.env.VITE_PRODUCT_VERSION}`;
export const DEFAULT_NODE_COUNT = 2000;
export const DEFAULT_CLUSTER_MODE: GenreClusterMode[] = ['subgenre'];
export const DEFAULT_ARTIST_CLUSTER_MODE: ArtistClusterMode = 'similarArtists';
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

export const ARTIST_LISTENER_TIERS: ListenerTier[] = [
    { id: 5, name: 'Mainstream', min: 1_000_000, max: Infinity, radius: 100, color: '#facc15' },    // yellow-400
    { id: 4, name: 'Popular', min: 100_000, max: 1_000_000, radius: 250, color: '#4ade80' },       // green-400
    { id: 3, name: 'Established', min: 10_000, max: 100_000, radius: 400, color: '#38bdf8' },      // sky-400
    { id: 2, name: 'Emerging', min: 1_000, max: 10_000, radius: 550, color: '#c084fc' },           // purple-400
    { id: 1, name: 'Underground', min: 0, max: 1_000, radius: 700, color: '#fb7185' },             // rose-400
];

export const GENRE_LISTENER_TIERS: ListenerTier[] = [
    { id: 5, name: 'Major', min: 10_000_000, max: Infinity, radius: 100, color: '#facc15' },       // yellow-400
    { id: 4, name: 'Large', min: 1_000_000, max: 10_000_000, radius: 250, color: '#4ade80' },      // green-400
    { id: 3, name: 'Medium', min: 100_000, max: 1_000_000, radius: 400, color: '#38bdf8' },        // sky-400
    { id: 2, name: 'Small', min: 10_000, max: 100_000, radius: 550, color: '#c084fc' },            // purple-400
    { id: 1, name: 'Niche', min: 0, max: 10_000, radius: 700, color: '#fb7185' },                  // rose-400
];
