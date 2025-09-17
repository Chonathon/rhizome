import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ArtistBadgeProps {
  name: string;
  onClick: () => void;
  imageUrl?: string;
  accentColor?: string;
  title?: string;
}

export default function ArtistBadge({
  name,
  onClick,
  imageUrl,
  accentColor,
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
          style={{ borderColor: accentColor }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${name} avatar`}
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="w-full h-full rounded-full bg-muted text-[10px] leading-4 text-center">
              {initial}
            </span>
          )}
        </span>
        {name}
      </Button>
    </Badge>
  );
}
