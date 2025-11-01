import { Genre, Artist } from '@/types'
import { fixWikiImageURL, formatNumber } from '@/lib/utils'
import { useMemo } from 'react'
import { Button } from './ui/button'
import { CirclePlay, ArrowRight, Loader2 } from 'lucide-react'
import GraphCard from './GraphCard'

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
        contentKey={genre?.name}

        thumbnail={
          imageArtists.length >= 2 ? (
            <div className="w-24 self-stretch shrink-0 overflow-hidden rounded-xl border border-border">
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
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
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="w-24 self-stretch shrink-0 overflow-hidden rounded-xl border border-border flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
              <span className="text-4xl font-semibold">{initial}</span>
            </div>
          )
        }

        title={
          <h2 className="w-full text-md font-semibold">
            {genre.name}
          </h2>
        }

        meta={
          <>
            {typeof genre.totalListeners === 'number' && (
              <h3>
                <span className="font-medium">Listeners:</span>{' '}
                {formatNumber(genre.totalListeners)}
              </h3>
            )}
            {typeof genre.artistCount === 'number' && (
              <h3>
                <span className="font-medium">Artists:</span>{' '}
                {formatNumber(genre.artistCount)}
              </h3>
            )}
            {typeof genre.totalPlays === 'number' && (
              <h3>
                <span className="font-medium">Plays:</span>{' '}
                {formatNumber(genre.totalPlays)}
              </h3>
            )}
          </>
        }

        description={
          genre.description && (
            <p className="break-words text-muted-foreground line-clamp-2">
              {genre.description}
            </p>
          )
        }

        actions={
          <div className="flex gap-2">
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
        }
      />
    </div>
  )
}

export default GenrePreview
