import { FeedItem as FeedItemType } from "@/types";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "./FeedItemSkeleton";
import { FeedEmptyState } from "./FeedEmptyState";

interface FeedListProps {
    items: FeedItemType[];
    loading: boolean;
    error: boolean;
    hasSelection: boolean;
    onRetry?: () => void;
}

export function FeedList({ items, loading, error, hasSelection, onRetry }: FeedListProps) {
    if (!hasSelection) {
        return <FeedEmptyState type="no-selection" />;
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-3 p-4 overflow-y-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                    <FeedItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return <FeedEmptyState type="error" onRetry={onRetry} />;
    }

    if (items.length === 0) {
        return <FeedEmptyState type="empty" />;
    }

    return (
        <div className="flex flex-col gap-3 px-2 py-4 overflow-y-auto flex-1">
            {items.map(item => (
                <FeedItem key={item.id} item={item} />
            ))}
        </div>
    );
}
