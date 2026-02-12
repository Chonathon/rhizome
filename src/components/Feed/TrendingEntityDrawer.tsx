import { useMemo } from "react";
import { FeedItem as FeedItemType } from "@/types";
import { ExtractedEntity, getItemsForEntity, getCooccurringEntities } from "@/lib/feedEntityExtraction";
import { BadgeIndicator, BadgeIndicatorType } from "@/components/BadgeIndicator";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer";
import { FeedItem } from "./FeedItem";
import { EntityBadge, ENTITY_TYPE_COLORS } from "./EntityBadge";

interface TrendingEntityDrawerProps {
    entity: ExtractedEntity | null;
    items: FeedItemType[];
    container: HTMLElement | null;
    onClose: () => void;
    onEntityClick: (entity: ExtractedEntity) => void;
}

export function TrendingEntityDrawer({
    entity,
    items,
    container,
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

    const headerTitle = entity ? (
        <span className="flex items-center justify-center gap-2">
            <BadgeIndicator
                type={entity.type as BadgeIndicatorType}
                name={entity.name}
                color={ENTITY_TYPE_COLORS[entity.type]}
                className="size-3"
            />
            {entity.name}
        </span>
    ) : null;

    const headerSubtitle = entity
        ? `${filteredItems.length} article${filteredItems.length !== 1 ? 's' : ''} in your feed`
        : undefined;

    return (
        <ResponsiveDrawer
            show={!!entity}
            onDismiss={onClose}
            container={container}
            headerTitle={headerTitle}
            headerSubtitle={headerSubtitle}
            contentClassName="top-[3%] z-10"
            bodyClassName="bg-accent rounded-t-2xl rounded-b-none shadow-2xl"
        >
            {cooccurring.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap px-1 pb-3 border-b">
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

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-0 py-3" data-drawer-scroll>
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
        </ResponsiveDrawer>
    );
}
