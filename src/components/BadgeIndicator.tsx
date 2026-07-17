import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';

export type BadgeIndicatorType = 'artist' | 'genre';

interface BadgeIndicatorProps {
  type: BadgeIndicatorType;
  name: string;
  color?: string;
  imageUrl?: string;
  className?: string;
  labelClassName?: string;
  icon?: LucideIcon;
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
                                 labelClassName,
                                 icon: Icon,
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
              'relative inline-flex size-5 items-center justify-center rounded-xl border',
              className,
          )}
          style={{ borderColor: color }}
      >
      <ImageWithFallback
          src={imageUrl}
          alt={`${name} avatar`}
          containerClassName="h-full w-full rounded-full overflow-hidden"
          className="h-full w-full rounded-full object-cover"
          fallback={
              <span className={cn("h-full w-full rounded-full bg-muted flex items-center justify-center text-[10px]", labelClassName)}>
              {initial}
            </span>
          }
      />
        {Icon && (
            <span className="absolute -bottom-0 -right-1 rounded-full bg-accent p-1 flex items-center justify-center">
          <Icon className="size-4 text-muted-foreground" />
        </span>
        )}
    </span>
  );
}
