import { useState, useCallback, useEffect } from "react";
import { FeedSource } from "@/types";
import { validateFeedUrl } from "@/apis/feedApi";

const STORAGE_KEY = "custom-feeds";

export function useCustomFeeds() {
    const [customFeeds, setCustomFeeds] = useState<FeedSource[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customFeeds));
    }, [customFeeds]);

    const addFeed = useCallback(async (url: string): Promise<{ success: boolean; error?: string; feedId?: string }> => {
        // Basic URL validation
        try {
            new URL(url);
        } catch {
            return { success: false, error: "Invalid URL" };
        }

        // Check for duplicates
        if (customFeeds.some((f) => f.url === url)) {
            return { success: false, error: "Feed already added" };
        }

        setAdding(true);
        try {
            const result = await validateFeedUrl(url);
            if (!result.valid) {
                return { success: false, error: "Not a valid RSS feed" };
            }

            const newFeed: FeedSource = {
                id: `custom-${Date.now()}`,
                name: result.title,
                url,
                category: "custom",
            };

            setCustomFeeds((prev) => [...prev, newFeed]);
            return { success: true, feedId: newFeed.id };
        } finally {
            setAdding(false);
        }
    }, [customFeeds]);

    const removeFeed = useCallback((id: string) => {
        setCustomFeeds((prev) => prev.filter((f) => f.id !== id));
    }, []);

    return {
        customFeeds,
        addFeed,
        removeFeed,
        adding,
    };
}
