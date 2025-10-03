import { cn } from '@/lib/utils';

export type BadgeIndicatorType = 'artist' | 'genre';

interface BadgeIndicatorProps {
  type: BadgeIndicatorType;
  name: string;
  color?: string;
  imageUrl?: string;
  className?: string;
}

/**
 * Shared visual indicator used to differentiate artists and genres via color, imagery, or initials.
 */
export function BadgeIndicator({
  type,
  name,
  color,
  imageUrl,
  className,
}: BadgeIndicatorProps) {
  if (type === 'genre') {
    return (
      <span
        aria-hidden="true"
        className={cn('inline-block size-2.5 rounded-full', className)}
        style={{ backgroundColor: color ?? '#ffffff' }}
      />
    );
  }

  const initial = name?.[0]?.toUpperCase() ?? '?';

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-5 items-center justify-center rounded-full border',
        className,
      )}
      style={{ borderColor: color }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} avatar`}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="h-full w-full rounded-full bg-muted text-center text-[10px] leading-5">
          {initial}
        </span>
      )}
    </span>
  );
}
