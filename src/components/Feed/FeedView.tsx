import { useState } from "react";
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
    const { items: trendingItems, loading: trendingLoading } = useMultipleFeeds({});
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
    const panelStyles = "border bg-accent flex flex-col min-w-[375px] max-w-[440px] max-h-[calc(100dvh-32px)] flex-1 shadow-xl rounded-4xl min-w-0 overflow-hidden";

    return (
        <div className="flex h-full justify-center bg-background pt-3 gap-4">
            {/* Following Panel */}
            <div className={panelStyles}>
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h2 className="text-sm font-medium">
                        Following
                        {followedFeeds.followedFeedIds.length > 0 && (
                            <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                {followedFeeds.followedFeedIds.length}
                            </span>
                        )}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={refreshFollowing}
                        disabled={followingLoading}
                        className="h-8 w-8"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${followingLoading ? "animate-spin" : ""}`}
                        />
                    </Button>
                </div>
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
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h2 className="text-sm font-medium">Everything</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={refreshEverything}
                        disabled={everythingLoading}
                        className="h-8 w-8"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${everythingLoading ? "animate-spin" : ""}`}
                        />
                    </Button>
                </div>
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
            <div className={`${panelStyles} relative`}>
                {/* Black backdrop for iOS depth effect */}
                <div className={`absolute inset-0 bg-white dark:bg-black rounded-4xl transition-opacity duration-300 ${
                    selectedTrendingEntity ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`} />
                {/* Background content — scales down and slides down iOS-style when drawer is open */}
                <div className={`flex flex-col flex-1 min-h-0 rounded-3xl transition-all duration-300 ease-out origin-top ${
                    selectedTrendingEntity ? 'scale-[0.90] translate-y-6 opacity-60 overflow-hidden ring-1 ring-border' : ''
                }`}>
                    <div className="px-4 py-3 border-b">
                        <h2 className="text-sm font-medium">Trending</h2>
                    </div>
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
                    onClose={() => setSelectedTrendingEntity(null)}
                    onEntityClick={setSelectedTrendingEntity}
                />
            </div>
        </div>
    );
}
