import { useEffect, useState, useCallback } from "react";
import { FeedItem, FeedCategory, FeedSource } from "@/types";
import { fetchFeed, fetchFeedBySource } from "@/apis/feedApi";
import { RSS_FEEDS } from "@/constants";

interface UseMultipleFeedsOptions {
    feedIds?: string[];
    category?: FeedCategory | null;
    customSources?: FeedSource[];
}

const useMultipleFeeds = ({ feedIds, category, customSources }: UseMultipleFeedsOptions = {}) => {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadFeeds = useCallback(async () => {
        let builtInSources = RSS_FEEDS;

        if (feedIds && feedIds.length > 0) {
            builtInSources = RSS_FEEDS.filter(f => feedIds.includes(f.id));
        } else if (category) {
            builtInSources = RSS_FEEDS.filter(f => f.category === category);
        }

        // Resolve custom sources: if feedIds filter is active, only include matching custom feeds
        let customToFetch: FeedSource[] = [];
        if (customSources && customSources.length > 0) {
            if (feedIds && feedIds.length > 0) {
                customToFetch = customSources.filter(f => feedIds.includes(f.id));
            } else {
                customToFetch = customSources;
            }
        }

        if (builtInSources.length === 0 && customToFetch.length === 0) {
            setItems([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const results = await Promise.all([
            ...builtInSources.map(source => fetchFeed(source.id)),
            ...customToFetch.map(source => fetchFeedBySource(source)),
        ]);

        const allItems: FeedItem[] = [];
        let hasError = false;

        results.forEach((result) => {
            if (result && result.status === "ok") {
                allItems.push(...result.items);
            } else {
                hasError = true;
            }
        });

        // Sort by date (newest first)
        allItems.sort((a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );

        setItems(allItems);
        if (hasError && allItems.length === 0) {
            setError(new Error("Failed to load feeds"));
        }
        setLoading(false);
    }, [feedIds, category, customSources]);

    useEffect(() => {
        loadFeeds();
    }, [loadFeeds]);

    const refresh = useCallback(() => {
        loadFeeds();
    }, [loadFeeds]);

    return {
        items,
        loading,
        error,
        refresh,
    };
};

export default useMultipleFeeds;
