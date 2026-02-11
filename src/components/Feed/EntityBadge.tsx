import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeIndicator, BadgeIndicatorType } from "@/components/BadgeIndicator";
import { ExtractedEntity } from "@/lib/feedEntityExtraction";

// Default colors for entity types (will be replaced with DB-driven colors)
export const ENTITY_TYPE_COLORS: Record<ExtractedEntity['type'], string> = {
    artist: '#60a5fa', // blue-400
    genre: '#c084fc',  // purple-400
    label: '#fbbf24',  // amber-400
    city: '#34d399',   // emerald-400
};

interface EntityBadgeProps {
    entity: ExtractedEntity;
    isActive?: boolean;
    onClick?: () => void;
}

export function EntityBadge({ entity, isActive, onClick }: EntityBadgeProps) {
    const color = ENTITY_TYPE_COLORS[entity.type];
    const badgeType: BadgeIndicatorType = entity.type;

    return (
        <Badge asChild variant="outline" title={`${entity.type}: ${entity.name}`}>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClick}
                className={`cursor-pointer inline-flex items-center gap-1.5 h-auto py-0.5 px-2 ${
                    isActive ? 'bg-accent ring-1 ring-ring' : ''
                }`}
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
