import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FeedCategory, FeedItem as FeedItemType } from "@/types";
import { FEED_CATEGORIES } from "@/constants";
import { FeedList } from "./FeedList";

interface EverythingFeedsViewProps {
    isFollowing: (feedId: string) => boolean;
    onToggleFollow: (feedId: string) => void;
    items: FeedItemType[];
    loading: boolean;
    error: boolean;
    onRetry?: () => void;
    selectedCategory: FeedCategory | "all";
    onCategoryChange: (category: FeedCategory | "all") => void;
}

export function EverythingFeedsView({
    isFollowing,
    onToggleFollow,
    items,
    loading,
    error,
    onRetry,
    selectedCategory,
    onCategoryChange,
}: EverythingFeedsViewProps) {
    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-2 border-b">
                <Select
                    value={selectedCategory}
                    onValueChange={(v) => onCategoryChange(v as FeedCategory | "all")}
                >
                    <SelectTrigger size="sm" className="m-w-[160px]">
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
            </div>
            <FeedList
                items={items}
                loading={loading}
                error={error}
                hasSelection={true}
                onRetry={onRetry}
                showFollowButton={true}
                isFollowing={isFollowing}
                onToggleFollow={onToggleFollow}
            />
        </div>
    );
}
