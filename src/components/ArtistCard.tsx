import { Artist } from '@/types'
import { fixWikiImageURL, formatNumberCompact } from '@/lib/utils'
import { useMemo } from 'react'
import { Button } from './ui/button'
import { CirclePlay, ArrowRight, SquarePlus, Loader2, Check } from 'lucide-react'
import GraphCard from './GraphCard'

interface ArtistCardProps {
  artist?: Artist
  genreColorMap?: Map<string, string>
  getGenreNameById?: (id: string) => string | undefined
  onCardClick?: () => void // Click entire card to open full info
  onPlay?: (artist: Artist) => void
  onToggle?: (artistId: string) => void
  playLoading?: boolean
  isInCollection?: boolean
  show: boolean
  deselectArtist: () => void
  isMobile?: boolean
}

export function ArtistCard({
  artist,
  genreColorMap,
  getGenreNameById,
  onCardClick,
  onPlay,
  onToggle,
  playLoading,
  isInCollection,
  show,
  deselectArtist,
  isMobile,
}: ArtistCardProps) {
  const initial = artist?.name?.[0]?.toUpperCase() ?? '?'

  const imageUrl = useMemo(() => {
    const raw = artist?.image
    return raw ? fixWikiImageURL(raw) : undefined
  }, [artist?.image])

  if (!show || !isMobile) return null

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md pointer-events-auto"
      style={{
        bottom: 'calc(68px + env(safe-area-inset-bottom))',
      }}
    >
      <div onClick={onCardClick} className="cursor-pointer">
        <GraphCard
          show={show}
          dismissible={true}
          onDismiss={deselectArtist}
          contentKey={artist?.name}
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
              {artist?.name}
            </h2>
          }
          meta={
            <>
              {typeof artist?.listeners === 'number' && (
                <h3>
                  {formatNumberCompact(artist.listeners)}{' '}
                  <span className="">Listeners</span>
                </h3>
              )}
            </>
          }
          description={
            <>
              {artist?.bio?.summary && (
                <p className="break-words text-muted-foreground line-clamp-2">
                  {artist.bio.summary}
                </p>
              )}
            </>
          }
          actions={
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  artist && onPlay?.(artist)
                }}
                disabled={playLoading}
                className="flex-1 disabled:opacity-100"
              >
                {playLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CirclePlay />
                )}
                Play
              </Button>
              <Button
                size="sm"
                variant={isInCollection ? 'secondary' : 'secondary'}
                onClick={(e) => {
                  e.stopPropagation()
                  artist && onToggle?.(artist.id)
                }}
                className="flex-1"
              >
                {isInCollection ? <Check /> : <SquarePlus />}
                {isInCollection ? 'Added' : 'Add'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onCardClick?.()
                }}
              >
                <ArrowRight />
              </Button>
            </div>
          }
        />
      </div>
    </div>
  )
}
