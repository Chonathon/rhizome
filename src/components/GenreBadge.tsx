import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeIndicator } from '@/components/BadgeIndicator';
import { X } from 'lucide-react';

interface GenreBadgeProps {
  name: string;
  onClick: () => void;
  genreColor?: string;
  title?: string;
  // Trailing X signalling that clicking the badge removes it
  removable?: boolean;
}

export default function GenreBadge({
  name,
  onClick,
  genreColor,
  title,
  removable,
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
        {removable && <X className="size-3 text-muted-foreground" />}
      </Button>
    </Badge>
  );
}
