import { Artist } from '@/types'
import { fixWikiImageURL, formatNumberCompact, formatDate } from '@/lib/utils'
import { useMemo, useState, useEffect } from 'react'
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

      />
    </div>
  )
}

export default ArtistPreview
