import { useFollowedFeeds } from "@/hooks/useFollowedFeeds";
import { FollowingFeedView } from "./FollowingFeedView";
import { AllFeedsView } from "./AllFeedsView";

export function FeedView() {
    const followedFeeds = useFollowedFeeds();
    const panelStyles = "border flex flex-col max-w-[540px] flex-1 shadow-xl rounded-2xl min-w-0"

    return (
        <div className="flex h-full justify-center bg-background gap-4">
            {/* Following Panel */}
            <div className={panelStyles}>
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
            <div className={panelStyles}>
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
