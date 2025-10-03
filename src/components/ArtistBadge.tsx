import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeIndicator } from '@/components/BadgeIndicator';

interface ArtistBadgeProps {
  name: string;
  onClick: () => void;
  imageUrl?: string;
  genreColor?: string;
  title?: string;
}

export default function ArtistBadge({
  name,
  onClick,
  imageUrl,
  genreColor,
  title,
}: ArtistBadgeProps) {
  return (
    <Badge asChild variant="outline" title={title ?? `Go to ${name}`}> 
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
        />
        {name}
      </Button>
    </Badge>
  );
}
