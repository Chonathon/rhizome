import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
          style={{ backgroundColor: genreColor ?? '#ffffff' }}
        >
          <span className="w-full h-full rounded-full bg-muted text-[10px] leading-4 text-center">
            {initial}
          </span>
        </span>
        {name}
      </Button>
    </Badge>
  );
}