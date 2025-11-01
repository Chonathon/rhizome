import { Artist } from '@/types'
import { fixWikiImageURL, formatNumber, formatDate } from '@/lib/utils'
import { useMemo } from 'react'
import { Button } from './ui/button'
import { CirclePlay, ArrowRight, SquarePlus, Loader2, Check } from 'lucide-react'
import GenreBadge from '@/components/GenreBadge'
import GraphCard from './GraphCard'

interface ArtistPreviewProps {
  artist: Artist
  genreColorMap?: Map<string, string>
  getGenreNameById?: (id: string) => string | undefined
  onNavigate?: (artist: Artist) => void
  onPlay?: (artist: Artist) => void
  onToggle?: (artistId: string) => void
  playLoading?: boolean
  isInCollection?: boolean
  position: { x: number; y: number }
  visible: boolean
}

export function ArtistPreview({
  artist,
  genreColorMap,
  getGenreNameById,
  onNavigate,
  onPlay,
  onToggle,
  playLoading,
  isInCollection,
  position,
  visible,
}: ArtistPreviewProps) {
  const initial = artist?.name?.[0]?.toUpperCase() ?? '?'

  const imageUrl = useMemo(() => {
    const raw = artist?.image
    return raw ? fixWikiImageURL(raw) : undefined
  }, [artist?.image])

  // Get top 3 genres
  const topGenres = useMemo(
    () => (artist?.genres ?? []).slice(0, 3),
    [artist?.genres]
  )

  if (!visible) return null

  return (
    <div
      className="absolute z-50 pointer-events-auto"
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

        thumbnail={
          imageUrl ? (
            <div className="w-24 h-24 shrink-0 overflow-hidden rounded-xl border border-border">
              <img
                className="w-24 h-24 object-cover"
                src={imageUrl}
                alt={artist?.name ?? 'Artist image'}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-24 h-24 shrink-0 overflow-hidden rounded-xl border border-border flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
              <span className="text-4xl font-semibold">{initial}</span>
            </div>
          )
        }

        title={
          <h2 className="w-full text-md font-semibold">
            {artist.name}
          </h2>
        }

        meta={
          <>
            {typeof artist.listeners === 'number' && (
              <h3>
                <span className="font-medium">Listeners:</span>{' '}
                {formatNumber(artist.listeners)}
              </h3>
            )}
            {artist.startDate && (
              <h3>
                <span className="font-medium">Founded:</span>{' '}
                {formatDate(artist.startDate)}
              </h3>
            )}
            {typeof artist.playcount === 'number' && (
              <h3>
                <span className="font-medium">Plays:</span>{' '}
                {formatNumber(artist.playcount)}
              </h3>
            )}
          </>
        }

        description={
          artist?.bio?.summary && (
            <p className="break-words text-muted-foreground line-clamp-2">
              {artist.bio.summary}
            </p>
          )
        }

        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onPlay?.(artist)}
              disabled={playLoading}
              className="flex-1 disabled:opacity-100"
            >
              {playLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CirclePlay className="size-4" />
              )}
              Play
            </Button>
            <Button
              size="sm"
              variant={isInCollection ? 'secondary' : 'secondary'}
              onClick={() => onToggle?.(artist.id)}
              className="flex-1"
            >
              {isInCollection ? (
                <Check className="size-4" />
              ) : (
                <SquarePlus className="size-4" />
              )}
              {isInCollection ? 'Added' : 'Add'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate?.(artist)}
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        }
      />
    </div>
  )
}

export default ArtistPreview
