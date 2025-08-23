export interface Genre extends BasicNode {
    artistCount: number;
    subgenre_of: BasicNode[];
    influenced_genres: BasicNode[];
    subgenres: BasicNode[];
    fusion_genres: BasicNode[];
    fusion_of: BasicNode[];
    influenced_by: BasicNode[];
}

export interface GenresJSON {
    count: number;
    genres: Genre[];
    links: NodeLink[];
    date: string;
}

export interface Tag {
    name: string;
    count: number;
}

export interface Artist extends BasicNode {
    tags: Tag[];
    location?: string;
    startDate?: string;
}

export interface ArtistJSON {
    count: number;
    artists: Artist[];
    links: NodeLink[];
    date: string;
    genre: string;
}

export interface BasicNode {
    id: string;
    name: string;
}

export interface NodeLink {
    source: string;
    target: string;
    linkType?: GenreClusterMode;
}

export interface LastFMArtistJSON extends BasicNode {
    image: string;
    ontour: boolean;
    stats: LastFMStats;
    bio: LastFMBio;
    similar: string[];
    date: string; // this is for caching
}

export interface LastFMStats {
    listeners: number;
    playcount: number;
}

export interface LastFMBio {
    link: string;
    summary: string;
    content: string;
}

export type GraphType = 'genres' | 'artists' | 'similarArtists' | 'parentGenre';

export interface LastFMSearchArtistData extends BasicNode {
    listeners: number;
}

export type GenreClusterMode = 'subgenre' | 'influence' | 'fusion';

export interface GenreGraphData {
    nodes: Genre[];
    links: NodeLink[];
}