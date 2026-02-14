import { FeedItem as FeedItemType } from "@/types";
import { FeedList } from "./FeedList";
import { FeedEmptyState } from "./FeedEmptyState";

interface ForYouFeedViewProps {
    items: FeedItemType[];
    loading: boolean;
    error: boolean;
    hasCollection: boolean;
    onRetry?: () => void;
    isFollowing: (feedId: string) => boolean;
    onToggleFollow: (feedId: string) => void;
}

export function ForYouFeedView({
    items,
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

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <FeedList
                items={items}
                loading={loading}
                error={error}
                hasSelection={true}
                onRetry={onRetry}
                showFollowButton={true}
                isFollowing={isFollowing}
                onToggleFollow={onToggleFollow}
            />
        </div>
    );
}
