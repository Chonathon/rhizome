import { cn } from '@/lib/utils';
import { ArrowUp, GitFork, ChevronRight } from 'lucide-react';

interface ArtistAvatarProps {
  name: string;
  imageUrl?: string;
  /** Genre color — used as border tint and out-of-view badge color */
  color?: string;
  /**
   * Whether the artist is currently visible in the graph.
   * - `true`  → in-graph icon (GitFork placeholder)
   * - `false` → out-of-view icon (ArrowUp, colored with `color`)
   * - `undefined` → no icon badge
   */
  isInView?: boolean;
  className?: string;
  labelClassName?: string;
}

/**
 * Artist avatar circle with an optional state-driven icon badge.
 * Used in GenreInfo (top artists) and ArtistInfo (similar artists).
 */
export function ArtistAvatar({
  name,
  imageUrl,
  color,
  isInView,
  className,
  labelClassName,
}: ArtistAvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? '?';

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex size-12 items-center justify-center rounded-full border',
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} avatar`}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className={cn(
            'h-full w-full rounded-full bg-muted flex items-center justify-center text-[10px]',
            labelClassName,
          )}
        >
          {initial}
        </span>
      )}

      {/* Out-of-view: ArrowUp icon colored with genre color */}
      {isInView === false && (
        <span className="absolute bottom-0 -right-1 size-5 rounded-full bg-accent flex items-center justify-center">
          <ChevronRight className="size-4" style={{ color: color }} />
        </span>
      )}

      {/* In-graph: neutral GitFork badge — TODO: swap GitFork for the right icon */}
      {isInView === true && (
        <span className="absolute bottom-0 -right-1 size-5 rounded-sm bg-accent flex items-center justify-center">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color ?? '#ffffff' }}
          />
        </span>
      )}
    </span>
  );
}

export default ArtistAvatar;
