import { FeedItem as FeedItemType } from "@/types";
import type { FeedItemMatch } from "@/lib/collectionFeedProfile";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "./FeedItemSkeleton";
import { FeedEmptyState } from "./FeedEmptyState";

export interface ScoredFeedItem {
    item: FeedItemType;
    score: number;
    matches: FeedItemMatch[];
}

interface ForYouFeedViewProps {
    scoredItems: ScoredFeedItem[];
    loading: boolean;
    error: boolean;
    hasCollection: boolean;
    onRetry?: () => void;
    isFollowing: (feedId: string) => boolean;
    onToggleFollow: (feedId: string) => void;
}

export function ForYouFeedView({
    scoredItems,
    loading,
    error,
    hasCollection,
    onRetry,
    isFollowing,
    onToggleFollow,
}: ForYouFeedViewProps) {
    if (!hasCollection) {
        return (
            <FeedEmptyState
                type="no-collection"
                message="Add artists to your collection to get personalized feed recommendations."
            />
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-4 py-2 px-4 overflow-y-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                    <FeedItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return <FeedEmptyState type="error" onRetry={onRetry} />;
    }

    if (scoredItems.length === 0) {
        return <FeedEmptyState type="empty" />;
    }

    return (
        <div className="flex flex-col gap-3 px-2 py-4 overflow-y-auto flex-1">
            {scoredItems.map(({ item, matches }) => (
                <FeedItem
                    key={item.id}
                    item={item}
                    showFollowButton={true}
                    isFollowing={isFollowing(item.sourceId)}
                    onToggleFollow={() => onToggleFollow(item.sourceId)}
                    matchReasons={matches}
                />
            ))}
        </div>
    );
}
