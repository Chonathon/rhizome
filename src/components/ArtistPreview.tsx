import { Artist } from '@/types'
import { fixWikiImageURL, formatNumber, formatDate } from '@/lib/utils'
import { useMemo } from 'react'
import { Button } from './ui/button'
import { CirclePlay, ArrowRight, SquarePlus, Loader2, Check } from 'lucide-react'
import GenreBadge from '@/components/GenreBadge'
import { Card } from '@/components/ui/card'

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
    <Card
      className="absolute z-50 w-80 p-0 overflow-hidden pointer-events-auto shadow-lg border-sidebar-border"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, calc(-100% - 8px))', // Center horizontally, position above node with 8px spacing
      }}
    >
      {/* Artist Image */}
      <div className="w-full h-[180px] overflow-hidden border-b border-sidebar-border">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artist?.name ?? 'Artist image'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
            <span className="text-4xl font-semibold">{initial}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-base leading-tight">
            {artist.name}
          </h3>
          {typeof artist.listeners === 'number' && (
            <p className="text-sm text-muted-foreground">
              {formatNumber(artist.listeners)} Listeners
            </p>
          )}
        </div>

        {/* Bio */}
        {artist?.bio?.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {artist.bio.summary}
          </p>
        )}

        {/* Genres */}
        {topGenres.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {topGenres.map((genreId) => {
              const name = getGenreNameById?.(genreId) ?? genreId
              const genreColor = genreColorMap?.get(genreId)
              return (
                <GenreBadge
                  key={genreId}
                  name={name}
                  genreColor={genreColor}
                  onClick={undefined}
                  className="pointer-events-none"
                />
              )
            })}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          {typeof artist.playcount === 'number' && (
            <div>
              <span className="text-muted-foreground">Plays: </span>
              <span className="font-medium">
                {formatNumber(artist.playcount)}
              </span>
            </div>
          )}
          {artist.startDate && (
            <div>
              <span className="text-muted-foreground">Founded: </span>
              <span className="font-medium">{formatDate(artist.startDate)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
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
      </div>
    </Card>
  )
}

export default ArtistPreview
