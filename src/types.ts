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
}

export interface BasicNode {
    id: string;
    name: string;
}

export interface NodeLink {
    source: string;
    target: string;
    linkType?: LinkType;
}

export interface LastFMBio {
    link: string;
    summary: string;
    content: string;
}

export type GraphType = 'genres' | 'artists' | 'similarArtists' | 'parentGenre';

export type GenreClusterMode = 'subgenre' | 'influence' | 'fusion' | 'all';

export type LinkType = 'subgenre' | 'influence' | 'fusion' | 'similar';

export interface GenreGraphData {
    nodes: Genre[];
    links: NodeLink[];
}

type KeysOfType<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T];

export type GenreNodeLimitType = KeysOfType<Genre, number>;

export type ArtistNodeLimitType = KeysOfType<Artist, number>;