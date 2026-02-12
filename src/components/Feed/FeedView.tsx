import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCategory } from "@/types";
import { ExtractedEntity } from "@/lib/feedEntityExtraction";
import { useFollowedFeeds } from "@/hooks/useFollowedFeeds";
import useMultipleFeeds from "@/hooks/useMultipleFeeds";
import { FollowingFeedView } from "./FollowingFeedView";
import { EverythingFeedsView } from "./EverythingFeedsView";
import { FeedTrendingTags } from "./FeedTrendingTags";
import { TrendingEntityDrawer } from "./TrendingEntityDrawer";

export function FeedView() {
    const followedFeeds = useFollowedFeeds();
    const [selectedCategory, setSelectedCategory] = useState<FeedCategory | "all">("all");
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
        category: selectedCategory === "all" ? null : selectedCategory,
    });
    const panelStyles = "border flex flex-col min-w-[393px] max-w-[440px] max-h-[calc(100dvh-32px)] flex-1 shadow-xl rounded-4xl min-w-0 overflow-hidden";
    function panelHeader(title: string, onRefresh: () => void, loading: boolean, badge?: React.ReactNode) {
        return (
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold leading-tight">
                    {title}
                    {badge}
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={loading}
                    className="h-8 w-8"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-full justify-center p-3 gap-4 overflow-x-auto">
            {/* Following Panel */}
            <div className={panelStyles}>
                {panelHeader(
                    "Following",
                    refreshFollowing,
                    followingLoading,
                    followedFeeds.followedFeedIds.length > 0 ? (
                        <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                            {followedFeeds.followedFeedIds.length}
                        </span>
                    ) : undefined,
                )}
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
                {panelHeader("Everything", refreshEverything, everythingLoading)}
                <EverythingFeedsView
                    isFollowing={followedFeeds.isFollowing}
                    onToggleFollow={followedFeeds.toggleFollow}
                    items={everythingItems}
                    loading={everythingLoading}
                    error={!!everythingError}
                    onRetry={refreshEverything}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
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
                    {panelHeader("Trending", refreshTrending, trendingLoading)}
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
