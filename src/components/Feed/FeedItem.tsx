import { FeedItem as FeedItemType } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FeedItemProps {
    item: FeedItemType;
    showFollowButton?: boolean;
    isFollowing?: boolean;
    onToggleFollow?: () => void;
}

function getFaviconUrl(link: string): string | null {
    try {
        const url = new URL(link);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
        return null;
    }
}

export function FeedItem({ item, showFollowButton, isFollowing, onToggleFollow }: FeedItemProps) {
    const initial =
        item.title?.[0]?.toUpperCase() ?? item.source?.[0]?.toUpperCase() ?? "?";
    const faviconUrl = getFaviconUrl(item.link);

    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFollow?.();
    };

    return (
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
        >
            <Card className="bg-card backdrop-blur-xs shadow-lg rounded-3xl border-border transition-colors hover:bg-accent/50 overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                    {item.imageUrl && (
                        <div className="shrink-0 overflow-hidden rounded-2xl border border-border aspect-square sm:aspect-video h-36">
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col items-stretch gap-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {faviconUrl && (
                                <div className="w-5 h-5 rounded bg-white dark:bg-white/90 p-0.5 flex items-center justify-center">
                                    <img
                                        src={faviconUrl}
                                        alt=""
                                        className="w-4 h-4"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <span className="font-medium">{item.source}</span>
                            <span>·</span>
                            <span>{formatDate(item.pubDate)}</span>
                            {item.author && (
                                <>
                                    <span>·</span>
                                    <span>{item.author}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="w-full leading-5 text-md font-semibold line-clamp-2 group-hover:text-primary">
                                {item.title}
                            </h3>
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        {item.excerpt && (
                            <p className="break-words text-sm text-muted-foreground line-clamp-2">
                                {item.excerpt}
                            </p>
                        )}
                        {showFollowButton && onToggleFollow && (
                            <div className="pt-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleFollowClick}
                                    title={isFollowing ? "Unfollow feed" : "Follow feed"}
                                >
                                    <Heart
                                        className={`h-4 w-4 ${
                                            isFollowing
                                                ? "fill-red-500 text-red-500"
                                                : "text-muted-foreground"
                                        }`}
                                    />
                                    {isFollowing ? "Following" : "Follow"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </a>
    );
}
