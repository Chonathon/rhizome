import { useState } from "react";
import { FeedItem as FeedItemType } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ExternalLink, Heart } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FeedItemProps {
    item: FeedItemType;
    variant?: 'default' | 'compact';
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

export function FeedItem({ item, variant = 'default', showFollowButton, isFollowing, onToggleFollow }: FeedItemProps) {
    const faviconUrl = getFaviconUrl(item.link);
    const [imgError, setImgError] = useState(false);
    const showImage = !!item.imageUrl && !imgError;

    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFollow?.();
    };

    if (variant === 'compact') {
        return (
            <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
            >
                <Card className="bg-card rounded-xl border-border transition-colors overflow-hidden">
                    <div className="flex items-center gap-3 p-2.5">
                        {showImage && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-primary">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                {faviconUrl && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-white dark:bg-white/90 p-px flex items-center justify-center">
                                        <img src={faviconUrl} alt="" className="w-3 h-3 rounded-full" loading="lazy" />
                                    </div>
                                )}
                                <span>{item.source}</span>
                                <span>·</span>
                                <span>{formatDate(item.pubDate)}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </a>
        );
    }

    return (
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
        >
            <Card className="bg-accent backdrop-blur-xs rounded-3xl border-border transition-colors hover:bg-accent/50 overflow-hidden">
                <div className="flex flex-col">
                    {showImage && (
                        <div className="overflow-hidden border-b border-border">
                            <div className="aspect-video w-full">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col items-stretch gap-2 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {faviconUrl && (
                                <div className="w-5 h-5 rounded-full bg-white dark:bg-white/90 p-0.5 flex items-center justify-center">
                                    <img
                                        src={faviconUrl}
                                        alt=""
                                        className="w-4 h-4 rounded-full"
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
                        <div className="flex justify-start w-auto items-end gap-1">
                            <h3 className="leading-5 text-md font-semibold line-clamp-2 wrap-break-word group-hover:text-primary">
                                {item.title}
                            </h3>
                                <ArrowUpRight className="text-muted-foreground size-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        {item.excerpt && (
                            <p className="text-muted-foreground ">
                                {item.excerpt}
                            </p>
                        )}
                        {showFollowButton && onToggleFollow && (
                            <div className="pt-1">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full bg-neutral-700 hover:bg-neutral-800"
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
