import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <Badge asChild variant="outline" title={title ?? `Go to ${name}`}> 
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="cursor-pointer inline-flex items-center gap-1.5"
      >
        <span
          className="inline-flex items-center justify-center rounded-full border-1 size-5"
          style={{ borderColor: genreColor }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${name} avatar`}
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="w-full h-full rounded-full bg-muted text-[10px] leading-5 text-center">
              {initial}
            </span>
          )}
        </span>
        {name}
      </Button>
    </Badge>
  );
}
