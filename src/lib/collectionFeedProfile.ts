/**
 * Collection-to-Feed Profile Mapping Utility
 *
 * Bridges the user's artist collection data (tags, genres, locations, names)
 * with the feed entity extraction vocabulary, producing a weighted profile
 * that can score feed articles for "For You" relevance.
 */

import { Artist, Genre, Tag, FeedItem } from "@/types";
import {
    GENRES,
    LABELS,
    CITIES,
    escapeRegex,
    formatEntityName,
} from "./feedEntityExtraction";
import { CITY_TO_COUNTRY } from "./locationNormalization";
import type { ExtractedEntity } from "./feedEntityExtraction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A weighted entity in the user's profile */
export interface ProfileEntity {
    name: string;
    displayName: string;
    type: ExtractedEntity["type"];
    weight: number;
    sourceCount: number;
}

/** Pre-compiled regex pattern with its scoring weight */
interface CompiledPattern {
    pattern: RegExp;
    weight: number;
    name: string;
    displayName: string;
    type: ExtractedEntity["type"];
}

/** A match reason explaining why an article was recommended */
export interface FeedItemMatch {
    name: string;
    type: ExtractedEntity["type"];
}

/** The complete user feed profile */
export interface UserFeedProfile {
    genres: ProfileEntity[];
    cities: ProfileEntity[];
    artists: ProfileEntity[];
    labels: ProfileEntity[];

    genreSet: Set<string>;
    citySet: Set<string>;
    artistSet: Set<string>;
    similarArtistSet: Set<string>;

    /** Genre-like tags from the collection that don't match the feed GENRES set */
    unmatchedGenreTags: Map<string, number>;

    stats: {
        totalArtists: number;
        totalTags: number;
        genreMatchRate: number;
        cityMatchRate: number;
        artistCount: number;
    };

    /** Pre-compiled regex patterns for fast scoring */
    _compiled: {
        artists: CompiledPattern[];
        similarArtists: CompiledPattern[];
        genres: CompiledPattern[];
        cities: CompiledPattern[];
        labels: CompiledPattern[];
    };
}

// ---------------------------------------------------------------------------
// Non-genre tag filtering
// ---------------------------------------------------------------------------

const NON_GENRE_TAGS = new Set([
    "seen live",
    "favorites",
    "favourite",
    "favourite artists",
    "favorite",
    "all",
    "beautiful",
    "awesome",
    "love",
    "loved",
    "cool",
    "check out",
    "spotify",
    "lastfm",
    "under 2000 listeners",
    "male vocalists",
    "female vocalists",
    "singer-songwriter",
]);

function isNonGenreTag(tag: string): boolean {
    if (NON_GENRE_TAGS.has(tag)) return true;
    // Decade patterns like "00s", "90s", "2010s"
    if (/^\d{2,4}s$/.test(tag)) return true;
    // Nationality terms
    if (
        /^(british|american|canadian|irish|french|german|swedish|norwegian|danish|finnish|japanese|korean|australian|italian|spanish|portuguese|brazilian|mexican|colombian|argentinian|chilean|dutch|belgian|swiss|austrian|polish|czech|hungarian|russian|ukrainian|israeli|turkish|chinese|thai|indian|south african|nigerian|kenyan|scottish|welsh|icelandic|cuban|jamaican|new zealand)$/i.test(
            tag
        )
    )
        return true;
    return false;
}

// ---------------------------------------------------------------------------
// Ambiguous artist name filtering
// ---------------------------------------------------------------------------

const AMBIGUOUS_ARTIST_NAMES = new Set([
    "the",
    "yes",
    "air",
    "low",
    "can",
    "ride",
    "wire",
    "tool",
    "live",
    "rush",
    "hole",
    "ash",
    "fur",
    "mae",
    "lit",
    "isis",
    "swans",
    "salt",
    "fun",
    "bush",
    "them",
]);

const MIN_ARTIST_NAME_LENGTH = 3;

// ---------------------------------------------------------------------------
// Precomputed city lookup from locationNormalization
// ---------------------------------------------------------------------------

const LOCATION_CITIES_LOWER = new Map<string, string>();
for (const cityName of Object.keys(CITY_TO_COUNTRY)) {
    LOCATION_CITIES_LOWER.set(cityName.toLowerCase(), cityName);
}

// ---------------------------------------------------------------------------
// Genre profile builder
// ---------------------------------------------------------------------------

interface GenreProfileResult {
    entities: ProfileEntity[];
    genreSet: Set<string>;
    unmatched: Map<string, number>;
    matchedTagCount: number;
    totalGenreTagCount: number;
}

function buildGenreProfile(
    artists: Artist[],
    genreById: Map<string, Genre>
): GenreProfileResult {
    const genreCounts = new Map<
        string,
        { weight: number; sourceCount: number }
    >();
    const unmatchedTags = new Map<string, number>();
    let matchedTagCount = 0;
    let totalGenreTagCount = 0;

    for (const artist of artists) {
        // Source 1: Artist tags that exist in the GENRES set
        if (artist.tags?.length) {
            for (const tag of artist.tags) {
                const normalized = tag.name.toLowerCase().trim();
                if (GENRES.has(normalized)) {
                    matchedTagCount++;
                    totalGenreTagCount++;
                    const existing = genreCounts.get(normalized);
                    if (existing) {
                        existing.weight += tag.count;
                        existing.sourceCount += 1;
                    } else {
                        genreCounts.set(normalized, {
                            weight: tag.count,
                            sourceCount: 1,
                        });
                    }
                } else if (!isNonGenreTag(normalized)) {
                    // Track genre-like tags that don't match GENRES
                    totalGenreTagCount++;
                    unmatchedTags.set(
                        normalized,
                        (unmatchedTags.get(normalized) || 0) + tag.count
                    );
                }
            }
        }

        // Source 2: Artist genre IDs → look up Genre name → check against GENRES
        if (artist.genres?.length) {
            for (const genreId of artist.genres) {
                const genre = genreById.get(genreId);
                if (genre) {
                    const normalized = genre.name.toLowerCase().trim();
                    if (GENRES.has(normalized)) {
                        const existing = genreCounts.get(normalized);
                        if (existing) {
                            existing.weight += 10;
                            existing.sourceCount += 1;
                        } else {
                            genreCounts.set(normalized, {
                                weight: 10,
                                sourceCount: 1,
                            });
                        }
                    }
                }
            }
        }
    }

    const maxWeight = Math.max(
        ...Array.from(genreCounts.values()).map((v) => v.weight),
        1
    );

    const entities: ProfileEntity[] = Array.from(genreCounts.entries())
        .map(([name, { weight, sourceCount }]) => ({
            name,
            displayName: formatEntityName(name),
            type: "genre" as const,
            weight: weight / maxWeight,
            sourceCount,
        }))
        .sort((a, b) => b.weight - a.weight);

    return {
        entities,
        genreSet: new Set(entities.map((e) => e.name)),
        unmatched: unmatchedTags,
        matchedTagCount,
        totalGenreTagCount,
    };
}

// ---------------------------------------------------------------------------
// City profile builder
// ---------------------------------------------------------------------------

interface CityProfileResult {
    entities: ProfileEntity[];
    citySet: Set<string>;
    matchedCount: number;
    totalWithLocation: number;
}

function extractCityFromLocation(location: string): string | null {
    if (!location?.trim()) return null;

    // Artist locations come in formats like:
    // "London", "London, England", "Brooklyn, New York, United States"
    const segments = location.split(",").map((s) => s.trim());

    // Check each segment against the feed CITIES set (lowercase)
    for (const segment of segments) {
        const lower = segment.toLowerCase();
        if (CITIES.has(lower)) {
            return lower;
        }
    }

    // Fall back to checking against the broader CITY_TO_COUNTRY keys
    for (const segment of segments) {
        const lower = segment.toLowerCase();
        if (LOCATION_CITIES_LOWER.has(lower) && CITIES.has(lower)) {
            return lower;
        }
    }

    return null;
}

function buildCityProfile(artists: Artist[]): CityProfileResult {
    const cityCounts = new Map<string, number>();
    let totalWithLocation = 0;
    let matchedCount = 0;

    for (const artist of artists) {
        if (artist.location) {
            totalWithLocation++;
            const city = extractCityFromLocation(artist.location);
            if (city) {
                matchedCount++;
                cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
            }
        }
    }

    const maxCount = Math.max(...cityCounts.values(), 1);

    const entities: ProfileEntity[] = Array.from(cityCounts.entries())
        .map(([name, count]) => ({
            name,
            displayName: formatEntityName(name),
            type: "city" as const,
            weight: count / maxCount,
            sourceCount: count,
        }))
        .sort((a, b) => b.weight - a.weight);

    return {
        entities,
        citySet: new Set(entities.map((e) => e.name)),
        matchedCount,
        totalWithLocation,
    };
}

// ---------------------------------------------------------------------------
// Artist name profile builder
// ---------------------------------------------------------------------------

interface ArtistProfileResult {
    entities: ProfileEntity[];
    artistSet: Set<string>;
    similarSet: Set<string>;
}

function buildArtistProfile(artists: Artist[]): ArtistProfileResult {
    const collectionNameSet = new Set(
        artists.map((a) => a.name.toLowerCase())
    );
    const similarNames = new Map<string, number>();

    const entities: ProfileEntity[] = artists.map((artist) => ({
        name: artist.name.toLowerCase(),
        displayName: artist.name,
        type: "artist" as const,
        weight: 1.0,
        sourceCount: 1,
    }));

    // Collect similar artist names not already in the collection
    for (const artist of artists) {
        if (artist.similar?.length) {
            for (const simName of artist.similar) {
                const simLower = simName.toLowerCase();
                if (!collectionNameSet.has(simLower)) {
                    similarNames.set(
                        simLower,
                        (similarNames.get(simLower) || 0) + 1
                    );
                }
            }
        }
    }

    return {
        entities,
        artistSet: collectionNameSet,
        similarSet: new Set(similarNames.keys()),
    };
}

// ---------------------------------------------------------------------------
// Label profile builder
// ---------------------------------------------------------------------------

function buildLabelProfile(artists: Artist[]): ProfileEntity[] {
    const labelCounts = new Map<string, number>();

    for (const artist of artists) {
        if (artist.tags?.length) {
            for (const tag of artist.tags) {
                const normalized = tag.name.toLowerCase().trim();
                if (LABELS.has(normalized)) {
                    labelCounts.set(
                        normalized,
                        (labelCounts.get(normalized) || 0) + tag.count
                    );
                }
            }
        }
    }

    const maxCount = Math.max(...labelCounts.values(), 1);

    return Array.from(labelCounts.entries())
        .map(([name, count]) => ({
            name,
            displayName: formatEntityName(name),
            type: "label" as const,
            weight: count / maxCount,
            sourceCount: count,
        }))
        .sort((a, b) => b.weight - a.weight);
}

// ---------------------------------------------------------------------------
// Regex compilation
// ---------------------------------------------------------------------------

function compilePatterns(
    names: Iterable<string>,
    weight: number,
    type: ExtractedEntity["type"]
): CompiledPattern[] {
    const patterns: CompiledPattern[] = [];
    for (const name of names) {
        if (
            name.length < MIN_ARTIST_NAME_LENGTH ||
            AMBIGUOUS_ARTIST_NAMES.has(name)
        )
            continue;
        patterns.push({
            pattern: new RegExp(`\\b${escapeRegex(name)}\\b`, "i"),
            weight,
            name,
            displayName: formatEntityName(name),
            type,
        });
    }
    return patterns;
}

function compileWeightedPatterns(entities: ProfileEntity[]): CompiledPattern[] {
    return entities.map((e) => ({
        pattern: new RegExp(`\\b${escapeRegex(e.name)}\\b`, "i"),
        weight: e.weight,
        name: e.name,
        displayName: e.displayName,
        type: e.type,
    }));
}

// ---------------------------------------------------------------------------
// Main profile builder
// ---------------------------------------------------------------------------

export function buildUserFeedProfile(
    artists: Artist[],
    genres: Genre[]
): UserFeedProfile {
    const genreById = new Map(genres.map((g) => [g.id, g]));

    const genreResult = buildGenreProfile(artists, genreById);
    const cityResult = buildCityProfile(artists);
    const artistResult = buildArtistProfile(artists);
    const labelEntities = buildLabelProfile(artists);

    return {
        genres: genreResult.entities,
        cities: cityResult.entities,
        artists: artistResult.entities,
        labels: labelEntities,

        genreSet: genreResult.genreSet,
        citySet: cityResult.citySet,
        artistSet: artistResult.artistSet,
        similarArtistSet: artistResult.similarSet,

        unmatchedGenreTags: genreResult.unmatched,

        stats: {
            totalArtists: artists.length,
            totalTags: artists.reduce(
                (sum, a) => sum + (a.tags?.length || 0),
                0
            ),
            genreMatchRate:
                genreResult.totalGenreTagCount > 0
                    ? genreResult.matchedTagCount /
                      genreResult.totalGenreTagCount
                    : 0,
            cityMatchRate:
                cityResult.totalWithLocation > 0
                    ? cityResult.matchedCount / cityResult.totalWithLocation
                    : 0,
            artistCount: artistResult.artistSet.size,
        },

        _compiled: {
            artists: compilePatterns(artistResult.artistSet, 1.0, "artist"),
            similarArtists: compilePatterns(artistResult.similarSet, 1.0, "artist"),
            genres: compileWeightedPatterns(genreResult.entities),
            cities: compileWeightedPatterns(cityResult.entities),
            labels: compileWeightedPatterns(labelEntities),
        },
    };
}

// ---------------------------------------------------------------------------
// Article scoring
// ---------------------------------------------------------------------------

const ARTIST_WEIGHT = 5.0;
const SIMILAR_ARTIST_WEIGHT = 2.0;
const GENRE_WEIGHT = 1.0;
const LABEL_WEIGHT = 0.8;
const CITY_WEIGHT = 0.5;

export function scoreFeedItem(
    item: FeedItem,
    profile: UserFeedProfile
): number {
    return scoreFeedItemDetailed(item, profile).score;
}

export function scoreFeedItemDetailed(
    item: FeedItem,
    profile: UserFeedProfile
): { score: number; matches: FeedItemMatch[] } {
    const text = `${item.title || ""} ${item.excerpt || ""}`.toLowerCase();
    let score = 0;
    const matches: FeedItemMatch[] = [];

    for (const p of profile._compiled.artists) {
        if (p.pattern.test(text)) {
            score += ARTIST_WEIGHT * p.weight;
            matches.push({ name: p.displayName, type: p.type });
        }
    }

    for (const p of profile._compiled.similarArtists) {
        if (p.pattern.test(text)) {
            score += SIMILAR_ARTIST_WEIGHT * p.weight;
            matches.push({ name: p.displayName, type: p.type });
        }
    }

    for (const p of profile._compiled.genres) {
        if (p.pattern.test(text)) {
            score += GENRE_WEIGHT * p.weight;
            matches.push({ name: p.displayName, type: p.type });
        }
    }

    for (const p of profile._compiled.labels) {
        if (p.pattern.test(text)) {
            score += LABEL_WEIGHT * p.weight;
            matches.push({ name: p.displayName, type: p.type });
        }
    }

    for (const p of profile._compiled.cities) {
        if (p.pattern.test(text)) {
            score += CITY_WEIGHT * p.weight;
            matches.push({ name: p.displayName, type: p.type });
        }
    }

    return { score, matches };
}
