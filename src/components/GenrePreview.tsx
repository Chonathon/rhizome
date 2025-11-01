import { Genre, Artist } from '@/types'
import { fixWikiImageURL, formatNumber } from '@/lib/utils'
import { useMemo } from 'react'
import { Button } from './ui/button'
import { CirclePlay, ArrowRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface GenrePreviewProps {
  genre: Genre
  topArtists?: Artist[]
  genreColorMap?: Map<string, string>
  onNavigate?: (genre: Genre) => void
  onPlay?: (genre: Genre) => void
  playLoading?: boolean
  position: { x: number; y: number }
  visible: boolean
}

export function GenrePreview({
  genre,
  topArtists,
  genreColorMap,
  onNavigate,
  onPlay,
  playLoading,
  position,
  visible,
}: GenrePreviewProps) {
  const initial = genre?.name?.[0]?.toUpperCase() ?? '?'

  // Get first 3 artists with images for the bento grid
  const imageArtists = useMemo(
    () =>
      (topArtists ?? [])
        .filter((a) => typeof a.image === 'string' && a.image.trim().length > 0)
        .slice(0, 3),
    [topArtists]
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
      {/* Image Grid - First Slide Only */}
      <div className="w-full h-[160px] overflow-hidden border-b border-sidebar-border">
        {imageArtists.length >= 2 ? (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
            {imageArtists.map((artist, i) => {
              const spanClasses = [
                'col-span-1 row-span-2', // 0: big left spans two rows
                'col-span-1 row-span-1', // 1: top-right
                'col-span-1 row-span-1', // 2: bottom-right
              ][i] || 'col-span-1 row-span-1'
              return (
                <div
                  key={artist.id}
                  className={`${spanClasses} relative overflow-hidden`}
                >
                  <img
                    src={fixWikiImageURL(artist.image as string)}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                  <span className="absolute left-1.5 bottom-1.5 text-xs font-medium text-white drop-shadow-sm">
                    {artist.name}
                  </span>
                </div>
              )
            })}
          </div>
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
            {genre.name}
          </h3>
          {typeof genre.totalListeners === 'number' && (
            <p className="text-sm text-muted-foreground">
              {formatNumber(genre.totalListeners)} Listeners
            </p>
          )}
        </div>

        {/* Description */}
        {genre.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {genre.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          {typeof genre.artistCount === 'number' && (
            <div>
              <span className="text-muted-foreground">Artists: </span>
              <span className="font-medium">
                {formatNumber(genre.artistCount)}
              </span>
            </div>
          )}
          {typeof genre.totalPlays === 'number' && (
            <div>
              <span className="text-muted-foreground">Plays: </span>
              <span className="font-medium">
                {formatNumber(genre.totalPlays)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            onClick={() => onPlay?.(genre)}
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
            variant="secondary"
            onClick={() => onNavigate?.(genre)}
            className="flex-1"
          >
            <ArrowRight className="size-4" />
            View
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default GenrePreview
