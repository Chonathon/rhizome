import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeIndicator } from '@/components/BadgeIndicator';
import { LucideIcon } from 'lucide-react';

interface ArtistBadgeProps {
  name: string;
  onClick: () => void;
  imageUrl?: string;
  genreColor?: string;
  title?: string;
  icon?: LucideIcon;
  variant?: "outline" | "default" | "secondary" | "destructive";
  className?: string;
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
      </Button>
    </Badge>
  );
}
