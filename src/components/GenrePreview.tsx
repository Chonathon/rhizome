import { Genre, Artist } from '@/types'
import { fixWikiImageURL, formatNumber, formatNumberCompact } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import GraphCard from './GraphCard'

interface GenrePreviewProps {
  genre: Genre
  topArtists?: Artist[]
  genreColorMap?: Map<string, string>
  onNavigate?: (genre: Genre) => void
  onAllArtists?: (genre: Genre) => void
  onPlay?: (genre: Genre) => void
  playLoading?: boolean
  position: { x: number; y: number }
  visible: boolean
  previewModeActive?: boolean
  onShow?: () => void
}

export function GenrePreview({
  genre,
  topArtists,
  genreColorMap,
  onNavigate,
  onAllArtists,
  onPlay,
  playLoading,
  position,
  visible,
  previewModeActive,
  onShow,
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

  // Track the actual cursor position so the preview follows the mouse
  const [cursorPosition, setCursorPosition] = useState(position)

  // Keep local cursor position in sync with the last graph-provided position
  useEffect(() => {
    setCursorPosition(position)
  }, [position.x, position.y])

  // When visible, follow the real cursor position
  useEffect(() => {
    if (!visible || typeof window === 'undefined') return

    const handleMouseMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${cursorPosition.x}px`,
        top: `${cursorPosition.y}px`,
        transform: 'translate(8px, -8px)', 
      }}
    >
      <GraphCard
        show={visible}
        dismissible={false}
        contentKey={genre?.name}
        enableHoverDelay={true}
        previewModeActive={previewModeActive}
        onShow={onShow}

        thumbnail={
          imageArtists.length >= 2 ? (
            <div className="w-24 h-24 aspect-square shrink-0 overflow-hidden rounded-xl border border-border">
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
            <div className="w-24 h-24 aspect-square shrink-0 overflow-hidden rounded-xl border border-border flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
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
                <span>{formatNumberCompact(genre.totalListeners)}{' '}Listeners</span>
                {typeof genre.artistCount === 'number' && (
                <span>{' · '}{formatNumberCompact(genre.artistCount)}{' '}Artists</span>
                )}
                {/* {typeof genre.totalPlays === 'number' && (
                <span>{' • '}{formatNumber(genre.totalPlays)} Plays:{' '}</span>
                )} */}
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

      />
    </div>
  )
}

export default GenrePreview
