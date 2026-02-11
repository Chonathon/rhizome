/**
 * Entity extraction utilities for extracting artists, genres, labels, and cities
 * from feed item text content.
 */

import { FeedItem } from "@/types";

export interface ExtractedEntity {
    name: string;
    type: 'artist' | 'genre' | 'label' | 'city';
    count: number;
}

export interface FeedTrendingData {
    artists: ExtractedEntity[];
    genres: ExtractedEntity[];
    labels: ExtractedEntity[];
    cities: ExtractedEntity[];
}

export interface EntityCooccurrence {
    source: string;
    target: string;
    weight: number;
}

// Common music genres to match
const GENRES = new Set([
    // Rock variants
    'rock', 'indie rock', 'alt-rock', 'alternative', 'punk', 'post-punk', 'garage rock',
    'psychedelic', 'shoegaze', 'dream pop', 'slowcore', 'sadcore', 'emo', 'screamo',
    'grunge', 'noise rock', 'math rock', 'prog rock', 'progressive', 'stoner rock',
    'hard rock', 'metal', 'hardcore', 'post-hardcore', 'metalcore', 'death metal',
    'black metal', 'doom', 'sludge', 'thrash',
    // Electronic
    'electronic', 'electronica', 'synth', 'synthpop', 'synth-pop', 'darkwave',
    'industrial', 'ebm', 'techno', 'house', 'deep house', 'tech house', 'ambient',
    'idm', 'breakbeat', 'drum and bass', 'dnb', 'jungle', 'dubstep', 'bass music',
    'trance', 'edm', 'electro', 'disco', 'nu-disco', 'italo disco',
    // Hip-hop
    'hip-hop', 'hip hop', 'rap', 'trap', 'drill', 'boom bap', 'conscious rap',
    'alternative hip-hop', 'experimental hip-hop', 'lo-fi hip hop',
    // Pop
    'pop', 'art pop', 'indie pop', 'electropop', 'hyperpop', 'k-pop', 'j-pop',
    'city pop', 'chamber pop', 'baroque pop', 'power pop', 'jangle pop',
    // Folk & Country
    'folk', 'indie folk', 'freak folk', 'psych folk', 'americana', 'country',
    'alt-country', 'bluegrass', 'roots',
    // R&B & Soul
    'r&b', 'rnb', 'soul', 'neo-soul', 'funk', 'disco', 'gospel',
    // Jazz & Blues
    'jazz', 'nu jazz', 'acid jazz', 'free jazz', 'fusion', 'blues', 'delta blues',
    // World
    'afrobeat', 'afrobeats', 'reggae', 'dub', 'dancehall', 'ska', 'latin',
    'bossa nova', 'flamenco', 'cumbia', 'reggaeton',
    // Classical & Experimental
    'classical', 'neoclassical', 'minimalist', 'experimental', 'avant-garde',
    'noise', 'drone', 'field recordings', 'musique concrète',
]);

// Notable indie record labels
const LABELS = new Set([
    // Major indies
    'sub pop', 'matador', 'merge', 'domino', '4ad', 'warp', 'ninja tune',
    'jagjaguwar', 'secretly canadian', 'dead oceans', 'kranky', 'thrill jockey',
    'drag city', 'touch and go', 'dischord', 'epitaph', 'fat wreck',
    'saddle creek', 'polyvinyl', 'run for cover', 'topshelf', 'deathwish',
    'relapse', 'nuclear blast', 'metal blade', 'century media',
    // Electronic
    'warp records', 'ninja tune', 'ghostly', 'hyperdub', 'xl recordings',
    'kompakt', 'ed banger', 'because music', 'monkeytown', 'brainfeeder',
    'stones throw', 'rhymesayers', 'lex records', 'anticon',
    // UK
    'rough trade', 'beggars banquet', 'mute', 'factory', 'creation',
    'heavenly', 'bella union', 'play it again sam',
    // Hip-hop
    'def jam', 'roc nation', 'top dawg', 'tde', 'mass appeal', 'griselda',
    // Other notable
    'captured tracks', 'sacred bones', 'mexican summer', 'fat possum',
    'new west', 'anti-', 'nonesuch', 'arts & crafts', 'dine alone',
    'partisan', 'city slang', 'ipecac', 'southern lord', 'constellation',
]);

// Major music cities (extracted from locationNormalization.ts plus music-specific cities)
const CITIES = new Set([
    // US
    'los angeles', 'new york', 'nyc', 'brooklyn', 'chicago', 'austin', 'nashville',
    'portland', 'seattle', 'atlanta', 'philadelphia', 'philly', 'boston', 'detroit',
    'miami', 'denver', 'minneapolis', 'oakland', 'san francisco', 'new orleans',
    'memphis', 'baltimore', 'cleveland', 'pittsburgh', 'richmond', 'athens',
    'chapel hill', 'omaha', 'louisville',
    // UK
    'london', 'manchester', 'bristol', 'glasgow', 'liverpool', 'birmingham',
    'leeds', 'brighton', 'sheffield', 'edinburgh', 'cardiff', 'dublin',
    // Canada
    'toronto', 'montreal', 'vancouver',
    // Europe
    'berlin', 'paris', 'amsterdam', 'stockholm', 'copenhagen', 'barcelona',
    'madrid', 'lisbon', 'brussels', 'vienna', 'hamburg', 'cologne', 'munich',
    'prague', 'warsaw', 'budapest', 'reykjavik',
    // Asia/Pacific
    'tokyo', 'seoul', 'melbourne', 'sydney', 'auckland',
    // Latin America
    'mexico city', 'buenos aires', 'são paulo', 'rio de janeiro', 'bogotá',
]);

/**
 * Extract text content from a feed item (title + excerpt)
 */
function getItemText(item: FeedItem): string {
    return `${item.title || ''} ${item.excerpt || ''}`.toLowerCase();
}

/**
 * Count occurrences of entities across all feed items
 */
function countEntities(
    items: FeedItem[],
    entitySet: Set<string>,
    type: ExtractedEntity['type']
): ExtractedEntity[] {
    const counts = new Map<string, number>();

    for (const item of items) {
        const text = getItemText(item);
        const foundInItem = new Set<string>();

        for (const entity of entitySet) {
            // Use word boundary matching for better accuracy
            const pattern = new RegExp(`\\b${escapeRegex(entity)}\\b`, 'i');
            if (pattern.test(text) && !foundInItem.has(entity)) {
                foundInItem.add(entity);
                counts.set(entity, (counts.get(entity) || 0) + 1);
            }
        }
    }

    return Array.from(counts.entries())
        .map(([name, count]) => ({
            name: formatEntityName(name),
            type,
            count,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format entity name for display (title case)
 */
function formatEntityName(name: string): string {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Extract all entity types from feed items
 */
export function extractFeedEntities(items: FeedItem[]): FeedTrendingData {
    return {
        artists: [], // TODO: Artist extraction requires NLP or database lookup
        genres: countEntities(items, GENRES, 'genre'),
        labels: countEntities(items, LABELS, 'label'),
        cities: countEntities(items, CITIES, 'city'),
    };
}

/**
 * Get top trending entities across all types
 */
export function getTopTrending(
    data: FeedTrendingData,
    limit: number = 8
): ExtractedEntity[] {
    const all = [
        ...data.genres,
        ...data.labels,
        ...data.cities,
    ];

    return all
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Extract entities found in a single feed item
 */
function extractEntitiesFromItem(item: FeedItem): Set<string> {
    const text = getItemText(item);
    const found = new Set<string>();

    const allEntities = [...GENRES, ...LABELS, ...CITIES];
    for (const entity of allEntities) {
        const pattern = new RegExp(`\\b${escapeRegex(entity)}\\b`, 'i');
        if (pattern.test(text)) {
            found.add(formatEntityName(entity));
        }
    }

    return found;
}

/**
 * Calculate co-occurrence relationships between entities
 * Returns links where entities appeared in the same article
 */
export function extractCooccurrences(
    items: FeedItem[],
    topEntities: ExtractedEntity[]
): EntityCooccurrence[] {
    const topEntityNames = new Set(topEntities.map(e => e.name));
    const cooccurrenceCounts = new Map<string, number>();

    for (const item of items) {
        const entitiesInItem = extractEntitiesFromItem(item);
        // Filter to only top entities
        const relevantEntities = [...entitiesInItem].filter(e => topEntityNames.has(e));

        // Create pairs for co-occurrence
        for (let i = 0; i < relevantEntities.length; i++) {
            for (let j = i + 1; j < relevantEntities.length; j++) {
                // Sort to ensure consistent key
                const pair = [relevantEntities[i], relevantEntities[j]].sort();
                const key = `${pair[0]}|||${pair[1]}`;
                cooccurrenceCounts.set(key, (cooccurrenceCounts.get(key) || 0) + 1);
            }
        }
    }

    return Array.from(cooccurrenceCounts.entries())
        .map(([key, weight]) => {
            const [source, target] = key.split('|||');
            return { source, target, weight };
        })
        .sort((a, b) => b.weight - a.weight);
}
