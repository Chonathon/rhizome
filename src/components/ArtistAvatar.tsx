import { cn } from '@/lib/utils';
import { ArrowUp, GitFork } from 'lucide-react';

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
        'relative inline-flex size-5 items-center justify-center rounded-xl border',
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
        <span
          className={cn(
            'h-full w-full rounded-full bg-muted flex items-center justify-center text-[10px]',
            labelClassName,
          )}
        >
          {initial}
        </span>
      )}

      {/* Out-of-view: ArrowUp badge colored with genre color */}
      {isInView === false && (
        <span
          className="absolute -bottom-0 -right-1 rounded-full p-1 flex items-center justify-center"
          style={{ backgroundColor: color ?? 'hsl(var(--accent))' }}
        >
          <ArrowUp className="size-4 text-white" />
        </span>
      )}

      {/* In-graph: neutral GitFork badge — TODO: swap GitFork for the right icon */}
      {isInView === true && (
        <span className="absolute -bottom-0 -right-1 rounded-full bg-accent p-1 flex items-center justify-center">
          <GitFork className="size-4 text-muted-foreground" />
        </span>
      )}
    </span>
  );
}

export default ArtistAvatar;
