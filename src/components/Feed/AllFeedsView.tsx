import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FeedCategory } from "@/types";
import { FEED_CATEGORIES } from "@/constants";
import useMultipleFeeds from "@/hooks/useMultipleFeeds";
import { FeedList } from "./FeedList";

interface AllFeedsViewProps {
    isFollowing: (feedId: string) => boolean;
    onToggleFollow: (feedId: string) => void;
}

export function AllFeedsView({ isFollowing, onToggleFollow }: AllFeedsViewProps) {
    const [selectedCategory, setSelectedCategory] = useState<FeedCategory | "all">("all");

    const { items, loading, error, refresh } = useMultipleFeeds({
        category: selectedCategory === "all" ? null : selectedCategory,
    });

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-2 border-b">
                <Select
                    value={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v as FeedCategory | "all")}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {FEED_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

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
            <FeedList
                items={items}
                loading={loading}
                error={!!error}
                hasSelection={true}
                onRetry={refresh}
                showFollowButton={true}
                isFollowing={isFollowing}
                onToggleFollow={onToggleFollow}
            />
        </div>
    );
}
