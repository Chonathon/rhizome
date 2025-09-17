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
  return (
    <Badge asChild variant="outline" title={title ?? `Go to ${name}`}> 
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="cursor-pointer inline-flex items-center gap-1.5"
      >
        <span
        className="inline-block rounded-full h-2 w-2"
        style={{ backgroundColor: genreColor ?? '#ffffff' }}
        />
        {name}
      </Button>
    </Badge>
  );
}