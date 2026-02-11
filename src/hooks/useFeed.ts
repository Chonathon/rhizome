import { useEffect, useState, useCallback } from "react";
import { FeedItem, FeedSource } from "@/types";
import { fetchFeed } from "@/apis/feedApi";
import { RSS_FEEDS } from "@/constants";

const useFeed = (feedId: string | null) => {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentSource, setCurrentSource] = useState<FeedSource | null>(null);

    const loadFeed = useCallback(async () => {
        if (!feedId) {
            setItems([]);
            setCurrentSource(null);
            setError(null);
            return;
        }

        const source = RSS_FEEDS.find(f => f.id === feedId);
        if (!source) {
            setError(new Error('Feed not found'));
            return;
        }

        setLoading(true);
        setError(null);
        setCurrentSource(source);

        const response = await fetchFeed(feedId);
        if (response && response.status === 'ok') {
            setItems(response.items);
        } else {
            setError(new Error('Failed to load feed'));
            setItems([]);
        }
        setLoading(false);
    }, [feedId]);

    useEffect(() => {
        loadFeed();
    }, [loadFeed]);

    useEffect(() => {
        if (error) {
            console.error('Feed error:', error);
        }
    }, [error]);

    const refresh = useCallback(() => {
        loadFeed();
    }, [loadFeed]);

    return {
        items,
        loading,
        error,
        currentSource,
        refresh,
    };
};

export default useFeed;
