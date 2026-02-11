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

const truncateText = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

export const fetchFeed = async (feedId: string): Promise<FeedResponse | null> => {
    const source = RSS_FEEDS.find(f => f.id === feedId);
    if (!source) {
        console.error(`Feed not found: ${feedId}`);
        return null;
    }

    try {
        const response = await axios.get<Rss2JsonResponse>(RSS2JSON_API, {
            params: { rss_url: source.url }
        });

        if (response.data.status !== 'ok') {
            console.error(`RSS2JSON error for ${feedId}`);
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
            console.error(`Failed to fetch feed ${feedId}:`, error.message);
        }
        return null;
    }
};

// Stubbed AI summary endpoint for future implementation
export const fetchFeedSummary = async (_feedId: string): Promise<string | null> => {
    // TODO: Implement AI summary feature
    return "AI summaries coming soon...";
};
