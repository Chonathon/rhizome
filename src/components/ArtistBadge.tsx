import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeIndicator } from '@/components/BadgeIndicator';
import { LucideIcon, X } from 'lucide-react';

interface ArtistBadgeProps {
  name: string;
  onClick: () => void;
  imageUrl?: string;
  genreColor?: string;
  title?: string;
  icon?: LucideIcon;
  variant?: "outline" | "default" | "secondary" | "destructive";
  className?: string;
  // Trailing X signalling that clicking the badge removes it
  removable?: boolean;
}

export default function ArtistBadge({
  name,
  onClick,
  imageUrl,
  genreColor,
  title,
  icon,
  variant = "outline",
  className,
  removable,
}: ArtistBadgeProps) {
  return (
    <Badge asChild variant={variant} className={className} title={title ?? `Go to ${name}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="cursor-pointer inline-flex items-center gap-1.5"
      >
        <BadgeIndicator
          type="artist"
          name={name}
          color={genreColor}
          imageUrl={imageUrl}
          icon={icon}
        />
        {name}
        {removable && <X className="size-3 text-muted-foreground" />}
      </Button>
    </Badge>
  );
}
