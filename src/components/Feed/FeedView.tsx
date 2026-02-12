import { useCallback, useRef, useState } from "react";
import { ExtractedEntity } from "@/lib/feedEntityExtraction";
import { useFollowedFeeds } from "@/hooks/useFollowedFeeds";
import useMultipleFeeds from "@/hooks/useMultipleFeeds";
import { RSS_FEEDS } from "@/constants";
import { FollowingFeedView } from "./FollowingFeedView";
import { EverythingFeedsView } from "./EverythingFeedsView";
import { FeedTrendingTags } from "./FeedTrendingTags";
import { TrendingEntityDrawer } from "./TrendingEntityDrawer";
import { FeedPanelHeader } from "./FeedPanelHeader";

export function FeedView() {
    const followedFeeds = useFollowedFeeds();
    const [selectedEverythingFeedIds, setSelectedEverythingFeedIds] = useState<string[]>([]);
    const [selectedTrendingEntity, setSelectedTrendingEntity] = useState<ExtractedEntity | null>(null);
    const trendingPanelRef = useRef<HTMLDivElement>(null);
    const { items: trendingItems, loading: trendingLoading, refresh: refreshTrending } = useMultipleFeeds({});
    const {
        items: followingItems,
        loading: followingLoading,
        error: followingError,
        refresh: refreshFollowing,
    } = useMultipleFeeds({ feedIds: followedFeeds.followedFeedIds });
    const {
        items: everythingItems,
        loading: everythingLoading,
        error: everythingError,
        refresh: refreshEverything,
    } = useMultipleFeeds({
        feedIds: selectedEverythingFeedIds.length > 0 ? selectedEverythingFeedIds : undefined,
    });

    const toggleEverythingFeed = useCallback((feedId: string) => {
        setSelectedEverythingFeedIds((prev) =>
            prev.includes(feedId)
                ? prev.filter((id) => id !== feedId)
                : [...prev, feedId]
        );
    }, []);

    const panelStyles = "border flex flex-col min-w-[393px] max-w-[440px] max-h-[calc(100dvh-32px)] flex-1 shadow-xl rounded-4xl min-w-0 overflow-hidden";

    return (
        <div className="flex h-full justify-center p-3 gap-4 overflow-x-auto">
            {/* Following Panel */}
            <div className={panelStyles}>
                <FeedPanelHeader
                    title="Following"
                    onRefresh={refreshFollowing}
                    loading={followingLoading}
                    dropdown={{
                        feeds: RSS_FEEDS.filter((f) =>
                            followedFeeds.followedFeedIds.includes(f.id)
                        ),
                        groupByCategory: false,
                        checkedIds: followedFeeds.followedFeedIds,
                        onToggle: followedFeeds.toggleFollow,
                        showClear: false,
                    }}
                />
                <FollowingFeedView
                    followedFeedIds={followedFeeds.followedFeedIds}
                    items={followingItems}
                    loading={followingLoading}
                    error={!!followingError}
                    onRetry={refreshFollowing}
                />
            </div>

            {/* Everything Panel */}
            <div className={panelStyles}>
                <FeedPanelHeader
                    title="Everything"
                    onRefresh={refreshEverything}
                    loading={everythingLoading}
                    dropdown={{
                        feeds: RSS_FEEDS,
                        groupByCategory: true,
                        checkedIds: selectedEverythingFeedIds,
                        onToggle: toggleEverythingFeed,
                    }}
                />
                <EverythingFeedsView
                    isFollowing={followedFeeds.isFollowing}
                    onToggleFollow={followedFeeds.toggleFollow}
                    items={everythingItems}
                    loading={everythingLoading}
                    error={!!everythingError}
                    onRetry={refreshEverything}
                />
            </div>

            {/* Trending Panel */}
            <div ref={trendingPanelRef} className={`${panelStyles} relative [transform:translateZ(0)]`}>
                {/* Black backdrop for iOS depth effect */}
                <div className={`absolute inset-0 bg-white dark:bg-black rounded-4xl transition-opacity duration-300 ${
                    selectedTrendingEntity ? 'opacity-30' : 'opacity-0 pointer-events-none'
                }`} />
                {/* Background content — scales down and slides down iOS-style when drawer is open */}
                <div className={`flex flex-col flex-1 min-h-0 rounded-3xl transition-all duration-300 ease-out origin-top ${
                    selectedTrendingEntity ? 'scale-[0.97] translate-y-6 opacity-70 bg-accent rounded-[34px] overflow-hidden ring-border' : ''
                }`}>
                    <FeedPanelHeader
                        title="Trending"
                        onRefresh={refreshTrending}
                        loading={trendingLoading}
                    />
                    <div className="flex-1 overflow-auto">
                        {!trendingLoading && trendingItems.length > 0 && (
                            <FeedTrendingTags
                                items={trendingItems}
                                selectedEntity={selectedTrendingEntity}
                                onEntityClick={setSelectedTrendingEntity}
                            />
                        )}
                    </div>
                </div>
                <TrendingEntityDrawer
                    entity={selectedTrendingEntity}
                    items={trendingItems}
                    container={trendingPanelRef.current}
                    onClose={() => setSelectedTrendingEntity(null)}
                    onEntityClick={setSelectedTrendingEntity}
                />
            </div>
        </div>
    );
}
