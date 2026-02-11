import { useEffect, useState, useCallback } from "react";
import { FeedItem, FeedCategory } from "@/types";
import { fetchFeed } from "@/apis/feedApi";
import { RSS_FEEDS } from "@/constants";

interface UseMultipleFeedsOptions {
    feedIds?: string[];
    category?: FeedCategory | null;
}

const useMultipleFeeds = ({ feedIds, category }: UseMultipleFeedsOptions = {}) => {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadFeeds = useCallback(async () => {
        let sourcesToFetch = RSS_FEEDS;

        if (feedIds && feedIds.length > 0) {
            sourcesToFetch = RSS_FEEDS.filter(f => feedIds.includes(f.id));
        } else if (category) {
            sourcesToFetch = RSS_FEEDS.filter(f => f.category === category);
        }

        if (sourcesToFetch.length === 0) {
            setItems([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const results = await Promise.all(
            sourcesToFetch.map(source => fetchFeed(source.id))
        );

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
    }, [feedIds, category]);

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
