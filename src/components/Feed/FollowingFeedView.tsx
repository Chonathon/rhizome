import { FeedItem as FeedItemType } from "@/types";
import { FeedList } from "./FeedList";
import { FeedEmptyState } from "./FeedEmptyState";

interface FollowingFeedViewProps {
    followedFeedIds: string[];
    items: FeedItemType[];
    loading: boolean;
    error: boolean;
    onRetry?: () => void;
}

export function FollowingFeedView({
    followedFeedIds,
    items,
    loading,
    error,
    onRetry,
}: FollowingFeedViewProps) {
    if (followedFeedIds.length === 0) {
        return (
            <FeedEmptyState
                type="no-following"
                message="You're not following any feeds yet. Browse the All tab to discover and follow feeds."
            />
        );
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* <div className="flex items-center px-4 py-2">
                <span className="text-sm text-muted-foreground">
                    {followedFeedIds.length} feed{followedFeedIds.length !== 1 ? "s" : ""}
                </span>
            </div> */}
            <FeedList
                items={items}
                loading={loading}
                error={error}
                hasSelection={true}
                onRetry={onRetry}
                showFollowButton={false}
            />
        </div>
    );
}
