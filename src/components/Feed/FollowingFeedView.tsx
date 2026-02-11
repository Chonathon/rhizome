import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMultipleFeeds from "@/hooks/useMultipleFeeds";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { FeedList } from "./FeedList";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedTrendingTags } from "./FeedTrendingTags";

interface FollowingFeedViewProps {
    followedFeedIds: string[];
    onUnfollow: (feedId: string) => void;
}

export function FollowingFeedView({ followedFeedIds, onUnfollow }: FollowingFeedViewProps) {
    const { isHidden, onScroll } = useHideOnScroll();
    const { items, loading, error, refresh } = useMultipleFeeds({
        feedIds: followedFeedIds,
    });

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
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out md:grid-rows-[1fr] ${
                    isHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                            {followedFeedIds.length} feed{followedFeedIds.length !== 1 ? "s" : ""}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={refresh}
                            disabled={loading}
                            className="h-8 w-8"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    {!loading && items.length > 0 && <FeedTrendingTags items={items} />}
                </div>
            </div>
            <FeedList
                items={items}
                loading={loading}
                error={!!error}
                hasSelection={true}
                onRetry={refresh}
                showFollowButton={false}
                onScroll={onScroll}
            />
        </div>
    );
}
