import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFollowedFeeds } from "@/hooks/useFollowedFeeds";
import { FollowingFeedView } from "./FollowingFeedView";
import { AllFeedsView } from "./AllFeedsView";

type FeedTab = "following" | "all";

export function FeedView() {
    const [activeTab, setActiveTab] = useState<FeedTab>("all");
    const followedFeeds = useFollowedFeeds();

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)}>
                    <TabsList>
                        <TabsTrigger value="following">
                            Following
                            {followedFeeds.followedFeedIds.length > 0 && (
                                <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                    {followedFeeds.followedFeedIds.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {activeTab === "following" ? (
                <FollowingFeedView
                    followedFeedIds={followedFeeds.followedFeedIds}
                    onUnfollow={followedFeeds.unfollowFeed}
                />
            ) : (
                <AllFeedsView
                    isFollowing={followedFeeds.isFollowing}
                    onToggleFollow={followedFeeds.toggleFollow}
                />
            )}
        </div>
    );
}
