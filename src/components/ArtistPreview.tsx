import { Artist } from '@/types'
import { fixWikiImageURL, formatNumberCompact, formatDate } from '@/lib/utils'
import { useMemo, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { CirclePlay, ArrowRight, SquarePlus, Loader2, Check, Disc3 } from 'lucide-react'
import GenreBadge from '@/components/GenreBadge'
import GraphCard from './GraphCard'
import ArtistBadge from './ArtistBadge'

interface ArtistPreviewProps {
  artist: Artist
  genreColorMap?: Map<string, string>
  getGenreNameById?: (id: string) => string | undefined
  onNavigate?: (artist: Artist) => void
  onPlay?: (artist: Artist) => void
  onPreview?: (artist: Artist) => void
  onToggle?: (artistId: string) => void
  playLoading?: boolean
  isInCollection?: boolean
  position: { x: number; y: number }
  visible: boolean
  // Similar artists
  getArtistImageByName?: (name: string) => string | undefined
  getArtistByName?: (name: string) => Artist | undefined
  setArtistFromName?: (name: string) => void
  getArtistColor?: (artist: Artist) => string | undefined
  // Hover delay
  previewModeActive?: boolean
  onShow?: () => void
}

export function ArtistPreview({
  artist,
  genreColorMap,
  getGenreNameById,
  onNavigate,
  onPlay,
  onPreview,
  onToggle,
  playLoading,
  isInCollection,
  position,
  visible,
  getArtistImageByName,
  getArtistByName,
  setArtistFromName,
  getArtistColor,
  previewModeActive,
  onShow,
}: ArtistPreviewProps) {
  const initial = artist?.name?.[0]?.toUpperCase() ?? '?'

  // Read preview mode preference from localStorage
  const [previewModeEnabled, setPreviewModeEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('previewModeEnabled') === 'true';
    }
    return false;
  });

  // Listen for storage changes (in case other components update the preference)
  useEffect(() => {
    const handleStorageChange = () => {
      setPreviewModeEnabled(localStorage.getItem('previewModeEnabled') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const imageUrl = useMemo(() => {
    const raw = artist?.image
    return raw ? fixWikiImageURL(raw) : undefined
  }, [artist?.image])

  // Get top 3 genres
  const topGenres = useMemo(
    () => (artist?.genres ?? []).slice(0, 3),
    [artist?.genres]
  )

  // Get top 3 similar artists
  const topSimilarArtists = useMemo(
    () => (artist?.similar ?? []).slice(0, 3),
    [artist?.similar]
  )

  if (!visible) return null

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, calc(-100% - 8px))', // Center horizontally, position above node with 8px spacing
      }}
    >
      <GraphCard
        show={visible}
        dismissible={false}
        contentKey={artist?.name}
        enableHoverDelay={true}
        previewModeActive={previewModeActive}
        onShow={onShow}

        thumbnail={
          imageUrl ? (
            <div className="w-24 self-stretch shrink-0 overflow-hidden rounded-xl border border-border">
              <img
                className="w-full h-full object-cover"
                src={imageUrl}
                alt={artist?.name ?? 'Artist image'}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-24 self-stretch shrink-0 overflow-hidden rounded-xl border border-border flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
              <span className="text-4xl font-semibold">{initial}</span>
            </div>
          )
        }

        title={
          <h2 className="w-full leading-5 text-md font-semibold">
            {artist.name}
          </h2>
        }

        meta={
          <>
            {typeof artist.listeners === 'number' && (
              <h3>
                {formatNumberCompact(artist.listeners)}{' '}
                <span className="">Listeners</span>
              </h3>
            )}
            {/* {artist.startDate && (
              <h3>
                <span className="font-medium">Founded:</span>{' '}
                {formatDate(artist.startDate)}
              </h3>
            )} */}
            {/* {typeof artist.playcount === 'number' && (
              <h3>
                <span className="font-medium">Plays:</span>{' '}
                {formatNumber(artist.playcount)}
              </h3>
            )} */}
          </>
        }

        description={
          <>
            {artist?.bio?.summary && (
              <p className="break-words text-muted-foreground line-clamp-2">
                {artist.bio.summary}
              </p>
            )}

            {/* Similar Artists */}
            {/* {topSimilarArtists.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs font-semibold">Similar Artists</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {topSimilarArtists.map((name) => {
                    const img = getArtistImageByName?.(name)
                    const artistObj = getArtistByName?.(name)
                    const genreColor = artistObj && getArtistColor ? getArtistColor(artistObj) : undefined
                    return (
                      <ArtistBadge
                        key={name}
                        name={name}
                        imageUrl={img}
                        genreColor={genreColor}
                        onClick={() => setArtistFromName?.(name)}
                        title={`Go to ${name}`}
                      />
                    )
                  })}
                </div>
              </div>
            )} */}
          </>
        }

        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => previewModeEnabled ? onPreview?.(artist) : onPlay?.(artist)}
              disabled={playLoading}
              className="flex-1 disabled:opacity-100"
            >
              {playLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : previewModeEnabled ? (
                <Disc3 />
              ) : (
                <CirclePlay />
              )}
              {previewModeEnabled ? 'Preview' : 'Play'}
            </Button>
            <Button
              size="sm"
              variant={isInCollection ? 'secondary' : 'secondary'}
              onClick={() => onToggle?.(artist.id)}
              className="flex-1"
            >
              {isInCollection ? (
                <Check />
              ) : (
                <SquarePlus />
              )}
              {isInCollection ? 'Added' : 'Add'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate?.(artist)}
            >
              <ArrowRight />
            </Button>
          </div>
        }
      />
    </div>
  )
}

export default ArtistPreview
