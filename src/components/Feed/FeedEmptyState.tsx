import { Rss, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedEmptyStateProps {
    type: 'empty' | 'error' | 'no-selection';
    onRetry?: () => void;
}

export function FeedEmptyState({ type, onRetry }: FeedEmptyStateProps) {
    if (type === 'no-selection') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Feed</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Choose a feed from the dropdown above to start reading.
                </p>
            </div>
        );
    }

    if (type === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-medium mb-2">Failed to load feed</h3>
                <p className="text-muted-foreground text-sm max-w-xs mb-4">
                    There was a problem loading this feed. Please try again.
                </p>
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Try Again
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Rss className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Items</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
                This feed doesn't have any items yet.
            </p>
        </div>
    );
}
