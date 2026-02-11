import { FeedItem as FeedItemType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FeedItemProps {
    item: FeedItemType;
}

export function FeedItem({ item }: FeedItemProps) {
    return (
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
        >
            <Card className="transition-colors hover:bg-accent/50 overflow-hidden">
                <div className="flex">
                    {item.imageUrl && (
                        <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32">
                            <img
                                src={item.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base font-medium line-clamp-2 group-hover:text-primary">
                                    {item.title}
                                </CardTitle>
                                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
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
                            {item.excerpt && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.excerpt}
                                </p>
                            )}
                        </CardContent>
                    </div>
                </div>
            </Card>
        </a>
    );
}
