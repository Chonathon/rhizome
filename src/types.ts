export interface Genre extends BasicNode {
    artistCount: number;
    subgenre_of: BasicNode[];
    influenced_genres: BasicNode[];
    subgenres: BasicNode[];
    fusion_genres: BasicNode[];
    fusion_of: BasicNode[];
    influenced_by: BasicNode[];
    description?: string;
    descriptionAI?: boolean;
    totalListeners?: number;
    totalPlays?: number;
    from?: string[];
    named_after_area?: string[];
    used_instruments?: string[];
    badDataFlag?: boolean;
    rootGenres: string[];
    specificRootGenres: RootGenreNode[];
    topArtists?: BasicNode[];
}

export interface Tag {
    name: string;
    count: number;
}

export interface Artist extends BasicNode {
    tags: Tag[];
    genres: string[];
    listeners: number;
    playcount: number;
    similar: string[];
    bio: LastFMBio;
    noMBID: boolean;
    location?: string;
    startDate?: string;
    endDate?: string;
    image?: string;
    badDataFlag?: boolean;
    topTracks?: TopTrack[];
    noTopTracks?: boolean;
    degree?: number;
}

export interface BasicNode {
    id: string;
    name: string;
}

export interface NodeLink {
    source: string;
    target: string;
    linkType: LinkType;
}

export interface LastFMBio {
    link: string;
    summary: string;
    content: string;
}

export type GraphType = 'genres' | 'artists' | 'similarArtists' | 'parentGenre';

export type GenreClusterMode = 'subgenre' | 'influence' | 'fusion';

export type LinkType = GenreClusterMode | 'similar';

export interface GenreGraphData {
    nodes: Genre[];
    links: NodeLink[];
}

type KeysOfType<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T];

export type GenreNodeLimitType = KeysOfType<Genre, number>;

export type ArtistNodeLimitType = KeysOfType<Artist, number>;

export interface BadDataReport {
    userID: string;
    type: 'artist' | 'genre';
    itemID: string;
    reason: string;
    resolved: boolean;
    details?: string;
}

export interface ReportReason {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface RootGenreNode {
    id: string;
    type: GenreClusterMode;
}

export interface InitialGenreFilter {
    genre: Genre | undefined;
    isRoot: boolean;
    parents: Record<string, Set<string>>;
}

export interface TopTrack extends TopTrackPlayIDs{
    title: string;
    artistName: string;
}

export interface TopTrackPlayIDs {
    youtube?: string;
    spotify?: string;
    apple?: string;
}

export type PlayerType = 'youtube' | 'spotify' | 'apple';

export type Theme = 'light' | 'dark' | 'system';

export interface Preferences {
    theme?: Theme;
    player?: PlayerType;
}

export type Social = 'google' | 'spotify';

export interface IDAndDate {
    id: string;
    date: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
    liked: IDAndDate[];
    preferences: Preferences;
    socialUser?: boolean;
}


export type AccountMenuState = "authorized" | "guest" | "nonOffice";
