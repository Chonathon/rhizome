import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { FeedItem } from "@/types";
import { extractFeedEntities, getTopTrending, ExtractedEntity } from "@/lib/feedEntityExtraction";
import { TrendingTagsGraph } from "./TrendingTagsGraph";
import { EntityBadge } from "./EntityBadge";

interface FeedTrendingTagsProps {
    items: FeedItem[];
    maxTags?: number;
    selectedEntity: ExtractedEntity | null;
    onEntityClick: (entity: ExtractedEntity) => void;
}

export function FeedTrendingTags({ items, maxTags = 8, selectedEntity, onEntityClick }: FeedTrendingTagsProps) {
    const [isGraphOpen, setIsGraphOpen] = useState(false);

    const trending = useMemo(() => {
        if (items.length === 0) return [];
        const entities = extractFeedEntities(items);
        return getTopTrending(entities, maxTags);
    }, [items, maxTags]);

    if (trending.length === 0) return null;

    return (
        <>
            <div className="px-4 py-3 border-y bg-muted/30 sm:hidden">
                <Collapsible open={isGraphOpen} onOpenChange={setIsGraphOpen}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto py-0.5 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                            >
                                Trending today
                                <ChevronDown
                                    className={`h-3 w-3 transition-transform ${isGraphOpen ? 'rotate-180' : ''}`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {trending.map((entity) => (
                                <EntityBadge
                                    key={`${entity.type}-${entity.name}`}
                                    entity={entity}
                                    isActive={selectedEntity?.name === entity.name}
                                    onClick={() => onEntityClick(entity)}
                                />
                            ))}
                        </div>
                    </div>
                    <CollapsibleContent>
                        <div className="pt-3">
                            <TrendingTagsGraph
                                items={items}
                                maxNodes={maxTags}
                                height={180}
                                onNodeClick={onEntityClick}
                            />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
            <div className="hidden sm:block px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">
                        Trending today
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {trending.map((entity) => (
                            <EntityBadge
                                key={`${entity.type}-${entity.name}`}
                                entity={entity}
                                isActive={selectedEntity?.name === entity.name}
                                onClick={() => onEntityClick(entity)}
                            />
                        ))}
                    </div>
                </div>
                <div className="pt-3 flex justify-center w-full">
                    <TrendingTagsGraph
                        items={items}
                        maxNodes={maxTags}
                        width={320}
                        height={180}
                        onNodeClick={onEntityClick}
                    />
                </div>
            </div>
        </>
    );
}
