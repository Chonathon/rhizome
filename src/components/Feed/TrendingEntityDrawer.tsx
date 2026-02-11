import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedItem as FeedItemType } from "@/types";
import { ExtractedEntity, getItemsForEntity, getCooccurringEntities } from "@/lib/feedEntityExtraction";
import { BadgeIndicator, BadgeIndicatorType } from "@/components/BadgeIndicator";
import { FeedItem } from "./FeedItem";
import { EntityBadge, ENTITY_TYPE_COLORS } from "./EntityBadge";

interface TrendingEntityDrawerProps {
    entity: ExtractedEntity | null;
    items: FeedItemType[];
    onClose: () => void;
    onEntityClick: (entity: ExtractedEntity) => void;
}

export function TrendingEntityDrawer({
    entity,
    items,
    onClose,
    onEntityClick,
}: TrendingEntityDrawerProps) {
    const filteredItems = useMemo(() => {
        if (!entity) return [];
        return getItemsForEntity(items, entity);
    }, [items, entity]);

    const cooccurring = useMemo(() => {
        if (!entity) return [];
        return getCooccurringEntities(items, entity);
    }, [items, entity]);

    return (
        <div
            className={`absolute inset-0 z-10 flex flex-col bg-background transition-transform duration-300 ease-out ${
                entity ? 'translate-y-0' : 'translate-y-full'
            }`}
        >
            {/* Header */}
            <div className="shrink-0 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {entity && (
                            <BadgeIndicator
                                type={entity.type as BadgeIndicatorType}
                                name={entity.name}
                                color={ENTITY_TYPE_COLORS[entity.type]}
                                className="size-3"
                            />
                        )}
                        <h2 className="text-lg font-semibold">
                            {entity?.name}
                        </h2>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {filteredItems.length} article{filteredItems.length !== 1 ? 's' : ''} in your feed
                </p>
                {cooccurring.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className="text-xs text-muted-foreground">Also trending:</span>
                        {cooccurring.map((coEntity) => (
                            <EntityBadge
                                key={`${coEntity.type}-${coEntity.name}`}
                                entity={coEntity}
                                onClick={() => onEntityClick(coEntity)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="flex flex-col gap-2">
                    {filteredItems.map((item) => (
                        <FeedItem
                            key={item.id}
                            item={item}
                            variant="compact"
                        />
                    ))}
                    {filteredItems.length === 0 && entity && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No matching articles found.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
