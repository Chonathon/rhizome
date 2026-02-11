import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RSS_FEEDS, FEED_CATEGORIES } from "@/constants";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedHeaderProps {
    selectedFeedId: string | null;
    onFeedChange: (feedId: string) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    aiSummaryEnabled?: boolean;
    onAiSummaryToggle?: (enabled: boolean) => void;
}

export function FeedHeader({
    selectedFeedId,
    onFeedChange,
    onRefresh,
    isRefreshing,
    aiSummaryEnabled = false,
    onAiSummaryToggle,
}: FeedHeaderProps) {
    // Group feeds by category
    const feedsByCategory = FEED_CATEGORIES.map(category => ({
        ...category,
        feeds: RSS_FEEDS.filter(feed => feed.category === category.id),
    })).filter(category => category.feeds.length > 0);

    return (
        <div className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-2">
                <Select value={selectedFeedId || undefined} onValueChange={onFeedChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a feed" />
                    </SelectTrigger>
                    <SelectContent>
                        {feedsByCategory.map(category => (
                            <SelectGroup key={category.id}>
                                <SelectLabel>{category.label}</SelectLabel>
                                {category.feeds.map(feed => (
                                    <SelectItem key={feed.id} value={feed.id}>
                                        {feed.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>

                {selectedFeedId && onRefresh && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="h-8 w-8"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>

            {onAiSummaryToggle && (
                <div className="flex items-center gap-2">
                    <Switch
                        id="ai-summary"
                        checked={aiSummaryEnabled}
                        onCheckedChange={onAiSummaryToggle}
                    />
                    <Label htmlFor="ai-summary" className="text-sm text-muted-foreground cursor-pointer">
                        AI Summary
                    </Label>
                </div>
            )}
        </div>
    );
}
