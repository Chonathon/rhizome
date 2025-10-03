import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeIndicator } from '@/components/BadgeIndicator';

interface GenreBadgeProps {
  name: string;
  onClick: () => void;
  genreColor?: string;
  title?: string;
}

export default function GenreBadge({
  name,
  onClick,
  genreColor,
  title,
}: GenreBadgeProps) {
  return (
    <Badge asChild variant="outline" title={title ?? `Go to ${name}`}> 
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="cursor-pointer inline-flex items-center gap-1.5"
      >
        <BadgeIndicator
          type="genre"
          name={name}
          color={genreColor}
          className="size-2"
        />
        {name}
      </Button>
    </Badge>
  );
}
