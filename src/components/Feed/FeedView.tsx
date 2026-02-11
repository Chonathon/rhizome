import { useState } from "react";
import { useSearchParams } from "react-router";
import useFeed from "@/hooks/useFeed";
import { FeedHeader } from "./FeedHeader";
import { FeedList } from "./FeedList";

export function FeedView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const feedId = searchParams.get('feed');

    const [aiSummaryEnabled, setAiSummaryEnabled] = useState(false);

    const { items, loading, error, refresh } = useFeed(feedId);

    const handleFeedChange = (newFeedId: string) => {
        setSearchParams({ feed: newFeedId });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <FeedHeader
                selectedFeedId={feedId}
                onFeedChange={handleFeedChange}
                onRefresh={refresh}
                isRefreshing={loading}
                aiSummaryEnabled={aiSummaryEnabled}
                onAiSummaryToggle={setAiSummaryEnabled}
            />
            <FeedList
                items={items}
                loading={loading}
                error={!!error}
                hasSelection={!!feedId}
                onRetry={refresh}
            />
            {aiSummaryEnabled && feedId && (
                <div className="p-4 border-t bg-muted/30">
                    <p className="text-sm text-muted-foreground italic">
                        AI summaries coming soon...
                    </p>
                </div>
            )}
        </div>
    );
}
