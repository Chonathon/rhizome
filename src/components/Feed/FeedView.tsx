import { useFollowedFeeds } from "@/hooks/useFollowedFeeds";
import { FollowingFeedView } from "./FollowingFeedView";
import { AllFeedsView } from "./AllFeedsView";

export function FeedView() {
    const followedFeeds = useFollowedFeeds();

    return (
        <div className="flex h-full bg-background">
            {/* Following Panel */}
            <div className="flex flex-col flex-1 min-w-0 border-r">
                <div className="px-4 py-3 border-b">
                    <h2 className="text-sm font-medium">
                        Following
                        {followedFeeds.followedFeedIds.length > 0 && (
                            <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                {followedFeeds.followedFeedIds.length}
                            </span>
                        )}
                    </h2>
                </div>
                <FollowingFeedView
                    followedFeedIds={followedFeeds.followedFeedIds}
                    onUnfollow={followedFeeds.unfollowFeed}
                />
            </div>

            {/* All Feeds Panel */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="px-4 py-3 border-b">
                    <h2 className="text-sm font-medium">For You</h2>
                </div>
                <AllFeedsView
                    isFollowing={followedFeeds.isFollowing}
                    onToggleFollow={followedFeeds.toggleFollow}
                />
            </div>
        </div>
    );
}
