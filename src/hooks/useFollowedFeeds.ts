import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "followed-feeds";

export function useFollowedFeeds() {
    const [followedFeedIds, setFollowedFeedIds] = useState<string[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(followedFeedIds));
    }, [followedFeedIds]);

    const followFeed = useCallback((feedId: string) => {
        setFollowedFeedIds(prev =>
            prev.includes(feedId) ? prev : [...prev, feedId]
        );
    }, []);

    const unfollowFeed = useCallback((feedId: string) => {
        setFollowedFeedIds(prev => prev.filter(id => id !== feedId));
    }, []);

    const isFollowing = useCallback((feedId: string) => {
        return followedFeedIds.includes(feedId);
    }, [followedFeedIds]);

    const toggleFollow = useCallback((feedId: string) => {
        if (followedFeedIds.includes(feedId)) {
            unfollowFeed(feedId);
        } else {
            followFeed(feedId);
        }
    }, [followedFeedIds, followFeed, unfollowFeed]);

    return {
        followedFeedIds,
        followFeed,
        unfollowFeed,
        isFollowing,
        toggleFollow,
    };
}
