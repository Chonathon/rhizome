import axios, { AxiosError } from "axios";
import { FeedItem, FeedResponse, FeedSource } from "@/types";
import { RSS_FEEDS } from "@/constants";

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

interface Rss2JsonItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    content: string;
}

interface Rss2JsonResponse {
    status: 'ok' | 'error';
    feed: {
        title: string;
        link: string;
        description: string;
    };
    items: Rss2JsonItem[];
}

const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').trim();
};

const truncateText = (text: string, maxLength: number = 400): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

export const fetchFeedBySource = async (source: FeedSource): Promise<FeedResponse | null> => {
    try {
        const response = await axios.get<Rss2JsonResponse>(RSS2JSON_API, {
            params: { rss_url: source.url }
        });

        if (response.data.status !== 'ok') {
            console.error(`RSS2JSON error for ${source.id}`);
            return null;
        }

        const items: FeedItem[] = response.data.items.map((item) => ({
            id: item.guid || item.link,
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: source.name,
            sourceId: source.id,
            excerpt: truncateText(stripHtml(item.description)),
            description: item.description || undefined,
            content: item.content || undefined,
            imageUrl: item.thumbnail || undefined,
            author: item.author || undefined,
        }));

        return {
            items,
            source,
            status: 'ok',
        };
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(`Failed to fetch feed ${source.id}:`, error.message);
        }
        return null;
    }
};

export const fetchFeed = async (feedId: string): Promise<FeedResponse | null> => {
    const source = RSS_FEEDS.find(f => f.id === feedId);
    if (!source) {
        console.error(`Feed not found: ${feedId}`);
        return null;
    }
    return fetchFeedBySource(source);
};

export const validateFeedUrl = async (url: string): Promise<{ valid: boolean; title: string }> => {
    try {
        const response = await axios.get<Rss2JsonResponse>(RSS2JSON_API, {
            params: { rss_url: url }
        });
        if (response.data.status === 'ok' && response.data.items.length > 0) {
            return { valid: true, title: response.data.feed.title || new URL(url).hostname };
        }
        return { valid: false, title: '' };
    } catch {
        return { valid: false, title: '' };
    }
};

// Stubbed AI summary endpoint for future implementation
export const fetchFeedSummary = async (_feedId: string): Promise<string | null> => {
    // TODO: Implement AI summary feature
    return "AI summaries coming soon...";
};
