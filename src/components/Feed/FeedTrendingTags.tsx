import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeIndicator, BadgeIndicatorType } from "@/components/BadgeIndicator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { FeedItem } from "@/types";
import { extractFeedEntities, getTopTrending, ExtractedEntity } from "@/lib/feedEntityExtraction";
import { TrendingTagsGraph } from "./TrendingTagsGraph";

interface FeedTrendingTagsProps {
    items: FeedItem[];
    maxTags?: number;
    onEntityClick?: (entity: ExtractedEntity) => void;
}

// Default colors for entity types (will be replaced with DB-driven colors)
const ENTITY_TYPE_COLORS: Record<ExtractedEntity['type'], string> = {
    artist: '#60a5fa', // blue-400
    genre: '#c084fc',  // purple-400
    label: '#fbbf24',  // amber-400
    city: '#34d399',   // emerald-400
};

function EntityBadge({
    entity,
    onClick
}: {
    entity: ExtractedEntity;
    onClick?: () => void;
}) {
    const color = ENTITY_TYPE_COLORS[entity.type];
    const badgeType: BadgeIndicatorType = entity.type;

    return (
        <Badge asChild variant="outline" title={`${entity.type}: ${entity.name}`}>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClick}
                className="cursor-pointer inline-flex items-center gap-1.5 h-auto py-0.5 px-2"
            >
                <BadgeIndicator
                    type={badgeType}
                    name={entity.name}
                    color={color}
                    className="size-2"
                />
                {entity.name}
            </Button>
        </Badge>
    );
}

export function FeedTrendingTags({ items, maxTags = 8, onEntityClick }: FeedTrendingTagsProps) {
    const [isGraphOpen, setIsGraphOpen] = useState(false);

    const trending = useMemo(() => {
        if (items.length === 0) return [];
        const entities = extractFeedEntities(items);
        return getTopTrending(entities, maxTags);
    }, [items, maxTags]);

    if (trending.length === 0) return null;

    return (
        <>
            <div className="px-4 py-3 border-b bg-muted/30 sm:hidden">
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
                                    onClick={onEntityClick ? () => onEntityClick(entity) : undefined}
                                />
                            ))}
                        </div>
                    </div>
                    <CollapsibleContent>
                        <div className="pt-3 flex justify-center w-full">
                            <TrendingTagsGraph
                                items={items}
                                maxNodes={maxTags}
                                width={320}
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
                                onClick={onEntityClick ? () => onEntityClick(entity) : undefined}
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
