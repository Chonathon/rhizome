import { FeedItem as FeedItemType } from "@/types";
import { FeedList } from "./FeedList";

interface EverythingFeedsViewProps {
    isFollowing: (feedId: string) => boolean;
    onToggleFollow: (feedId: string) => void;
    items: FeedItemType[];
    loading: boolean;
    error: boolean;
    onRetry?: () => void;
}

export function EverythingFeedsView({
    isFollowing,
    onToggleFollow,
    items,
    loading,
    error,
    onRetry,
}: EverythingFeedsViewProps) {
    return (
        <div className="flex flex-col flex-1 overflow-hidden">
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
