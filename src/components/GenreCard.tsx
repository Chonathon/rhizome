import { BasicNode, Genre, Artist } from '@/types'
import { formatNumber } from '@/lib/utils'
import { useEffect, useMemo, useRef, useState } from "react"
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from './ui/button';
import useGenreArtists from "@/hooks/useGenreArtists";
import { SquareArrowUp, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from './ui/badge';



interface GenreCardProps {
  selectedGenre?: Genre;
  allArtists: (genre: Genre) => void
  show: boolean;
  genreLoading: boolean;
  genreError?: boolean;
  deselectGenre: () => void;
  onSelectGenre?: (name: string) => void;
  onLinkedGenreClick: (genreID: string) => void;
  limitRelated?: number;
  onTopArtistClick?: (artist: Artist) => void;
}

export function GenreCard({
  selectedGenre,
  show,
  genreLoading,
  genreError,
  allArtists,
  deselectGenre,
  onSelectGenre,
  onLinkedGenreClick,
  limitRelated = 5,
  onTopArtistClick,
}: GenreCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [open, setOpen] = useState(false)

  const onDismiss = () => {
    setIsExpanded(false)
    setOpen(false)
    deselectGenre()
  }

  const relatedLine = (label: string, nodes?: BasicNode[]) => {
    if (!nodes || nodes.length === 0) return null
    const items = nodes.slice(0, limitRelated)
    return (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="text-md text-muted-foreground">{label}:</span>
        <div className='flex items-center gap-1.5 flex-wrap'>
          {items.map((node, i) => (
            <>
              {onLinkedGenreClick ? (
                <Button variant="link" size="lg" key={node.id} onClick={() => onLinkedGenreClick(node.id)}>{node.name}</Button>
              ) : (
                <span key={node.id}>{node.name}</span>
              )}
              {i < items.length - 1 ? ' · ' : ''}
            </>
          ))}
        </div>
      </div>
    )
  }

  const isDesktop = useMediaQuery("(min-width: 1200px)")
  const isSmallScreen = useMediaQuery("(min-width: 768px)")

  const initial = selectedGenre?.name?.[0]?.toUpperCase() ?? '?'

  // Top artists for this genre (by listeners)
  const { artists: genreArtists } = useGenreArtists(selectedGenre?.id)
  const topArtists = (genreArtists ?? [])
    .slice()
    .sort((a, b) => (b.listeners ?? 0) - (a.listeners ?? 0))
    .slice(0, 8)

  // Prepare images for a bento carousel (desktop thumbnail area)
  const imageArtists = useMemo(
    () => (topArtists ?? []).filter(a => typeof a.image === 'string' && a.image.trim().length > 0),
    [topArtists]
  )
  const chunk = <T,>(arr: T[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
  const slides = useMemo(() => chunk(imageArtists, 3), [imageArtists])
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  // Mobile carousel refs/state (for non-desktop rendering below Top Artists)
  const mobileScrollerRef = useRef<HTMLDivElement | null>(null)
  const [mCanPrev, setMCanPrev] = useState(false)
  const [mCanNext, setMCanNext] = useState(false)
  const scrollByWidth = (dir: 'prev' | 'next') => {
    const el = scrollerRef.current
    if (!el) return
    const delta = dir === 'next' ? el.clientWidth : -el.clientWidth
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const updateCarouselNav = () => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth)
    setCanPrev(scrollLeft > 1)
    setCanNext(scrollLeft < maxScrollLeft - 1)
  }

  const scrollByWidthMobile = (dir: 'prev' | 'next') => {
    const el = mobileScrollerRef.current
    if (!el) return
    const delta = dir === 'next' ? el.clientWidth : -el.clientWidth
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const updateMobileCarouselNav = () => {
    const el = mobileScrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth)
    setMCanPrev(scrollLeft > 1)
    setMCanNext(scrollLeft < maxScrollLeft - 1)
  }

  // Auto-open the sheet when a genre is selected and show is true
  useEffect(() => {
    if (show && selectedGenre) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [show, selectedGenre])

  // Reset carousel scroll position when a new genre is selected
  useEffect(() => {
    if (scrollerRef?.current) {
      scrollerRef.current.scrollTo({ left: 0, behavior: 'auto' })
      // Ensure nav state matches reset position
      requestAnimationFrame(updateCarouselNav)
    }
    if (mobileScrollerRef?.current) {
      mobileScrollerRef.current.scrollTo({ left: 0, behavior: 'auto' })
      requestAnimationFrame(updateMobileCarouselNav)
    }
  }, [selectedGenre?.id])

  useEffect(() => {
    // Recalculate nav availability when slides change
    requestAnimationFrame(updateCarouselNav)
    requestAnimationFrame(updateMobileCarouselNav)
  }, [slides.length])

  if (!show) return null

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onDismiss()
      }}
      direction={isDesktop ? "right" : "bottom"}
      dismissible={true}
      modal={false}
    >
      <DrawerContent
        className={`w-full h-full rounded-l-3xl
          ${isDesktop ? 'max-w-sm px-2' : isSmallScreen ? 'h-[35vh]' : ''}`}
      >
        {/* Sidebar-styled container */}
        <div className={`relative px-3 bg-sidebar backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm h-full w-full overflow-clip flex flex-col min-h-0
          ${isDesktop ? 'pl-4' : 'py-1'}`}>
          {/* Close button */}
            <div className="flex justify-end -mx-2.5 -mb-1">
              <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Close genre">
                <X />
              </Button>
            </div>
            {/* Scrolling Container */}
          <div className='w-full flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto no-scrollbar'>
            {/* Thumbnail / Bento Carousel (desktop only) */}
            <div className={`w-full overflow-hidden border-b border-sidebar-border rounded-lg h-[200px] shrink-0 flex-none
              ${isDesktop ? '' : 'hidden'}`}>
              {slides.length >= 1 && imageArtists.length >= 2 ? (
                <div className="relative w-full h-full">
                  <div
                    ref={scrollerRef}
                    onScroll={updateCarouselNav}
                    className="h-full w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                  >
                    {slides.map((chunk, idx) => (
                      <div key={idx} className="snap-center shrink-0 w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                        {chunk.map((artist, i) => {
                          const spanClasses = [
                            "col-span-1 row-span-2", // 0: big left spans two rows
                            "col-span-1 row-span-1", // 1: top-right
                            "col-span-1 row-span-1", // 2: bottom-right
                          ][i] || "col-span-1 row-span-1"
                          return (
                            <div key={artist.id} className={`${spanClasses} relative overflow-hidden rounded-md`}>
                              <button
                                type="button"
                                onClick={() => onTopArtistClick?.(artist)}
                                title={artist.name}
                                className="group block w-full h-full focus:outline-none"
                              >
                                <img
                                  src={(artist.image as string)}
                                  alt={artist.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                                <span className="absolute left-1.5 bottom-1.5 text-xs font-medium text-white drop-shadow-sm">{artist.name}</span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  {slides.length > 1 && (canPrev || canNext) && (
                    <div className="absolute inset-0 pointer-events-none">
                      {canPrev && (
                        <Button
                          className="pointer-events-auto h-full absolute rounded-none bg-background left-0 top-1/2 -translate-y-1/2"
                          variant="ghost"
                          size="sm"
                          onClick={() => scrollByWidth('prev')}
                          aria-label="Previous"
                        >
                          <ChevronLeft />
                        </Button>
                      )}
                      {canNext && (
                        <Button
                          className="pointer-events-auto h-full absolute rounded-none bg-background right-0 top-1/2 -translate-y-1/2"
                          variant="ghost"
                          size="icon"
                          onClick={() => scrollByWidth('next')}
                          aria-label="Next"
                        >
                          <ChevronRight />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
                  <span className="text-4xl font-semibold">{initial}</span>
                </div>
              )}
            </div>
            {/* Content */}
            <div className="w-full flex flex-col gap-6 ">
              <div>
                <h2 className="text-xl font-semibold">{selectedGenre?.name}</h2>
                <p
                  onClick={() => setIsExpanded(prev => !prev)}
                  className={` mt-3 break-words text-muted-foreground cursor-pointer hover:text-gray-400 ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
                >
                  {selectedGenre?.description || 'No description'}
                </p>
              </div>
                {/* Top Artists */}
                {topArtists.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-md font-semibold">Top Artists</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                    {topArtists.map((artist) => (
                      <Badge
                        key={artist.id}
                        asChild
                        variant="outline"
                        title={`${artist.listeners?.toLocaleString() ?? 0} listeners`}
                      >
                        <Button variant="ghost" size="sm" onClick={() => onTopArtistClick?.(artist)} className="cursor-pointer">
                          {artist.name}
                        </Button>
                      </Badge>
                    ))}
                    </div>
                <Button
                  disabled={genreLoading}
                  size="lg"
                  variant="secondary"
                  onClick={() => selectedGenre && allArtists(selectedGenre)}
                  className='mt-2 self-start'
                >
                  <SquareArrowUp />All Artists
                </Button>
                  </div>
                )}

                {/* Mobile Thumbnail / Carousel (non-desktop) */}
                {!isDesktop && slides.length >= 1 && imageArtists.length >= 2 && (
                  <div className="w-full overflow-hidden border-y border-sidebar-border rounded-lg h-[200px] shrink-0 flex-none">
                    <div className="relative w-full h-full">
                      <div
                        ref={mobileScrollerRef}
                        onScroll={updateMobileCarouselNav}
                        className="h-full w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                      >
                        {slides.map((chunk, idx) => (
                          <div key={idx} className="snap-center shrink-0 w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                            {chunk.map((artist, i) => {
                              const spanClasses = [
                                "col-span-1 row-span-2",
                                "col-span-1 row-span-1",
                                "col-span-1 row-span-1",
                              ][i] || "col-span-1 row-span-1"
                              return (
                                <div key={artist.id} className={`${spanClasses} relative overflow-hidden rounded-md`}>
                                  <button
                                    type="button"
                                    onClick={() => onTopArtistClick?.(artist)}
                                    title={artist.name}
                                    className="group block w-full h-full focus:outline-none"
                                  >
                                    <img
                                      src={(artist.image as string)}
                                      alt={artist.name}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                                    <span className="absolute left-1.5 bottom-1.5 text-xs font-medium text-white drop-shadow-sm">{artist.name}</span>
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      {slides.length > 1 && (mCanPrev || mCanNext) && (
                        <div className="absolute inset-0 pointer-events-none">
                          {mCanPrev && (
                            <Button
                              className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2"
                              variant="ghost"
                              size="icon"
                              onClick={() => scrollByWidthMobile('prev')}
                              aria-label="Previous"
                            >
                              <ChevronLeft />
                            </Button>
                          )}
                          {mCanNext && (
                            <Button
                              className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2"
                              variant="ghost"
                              size="icon"
                              onClick={() => scrollByWidthMobile('next')}
                              aria-label="Next"
                            >
                              <ChevronRight />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            
              {/* Related */}
              {genreError && <p>Can’t find {selectedGenre?.name} 🤔</p>}
              {!genreError && (
                <div className='flex flex-col gap-2'>
                  <text className='text-md font-semibold'>Related</text>
                  <>
                    {relatedLine('Subgenre of', selectedGenre?.subgenre_of)}
                    {relatedLine('Subgenres', selectedGenre?.subgenres)}
                    {relatedLine('Influenced by', selectedGenre?.influenced_by)}
                    {relatedLine('Influences', selectedGenre?.influenced_genres)}
                    {relatedLine('Fusion of', selectedGenre?.fusion_of)}
                  </>
                </div>
              )}
              {/* Stats */}
              <div className="flex flex-col gap-2">
                <text className='text-md font-semibold'>Stats</text>
                    {typeof selectedGenre?.artistCount === 'number' && (
                      <h3>
                        <span className="text-md text-muted-foreground">Artists:</span>{' '}
                        {formatNumber(selectedGenre.artistCount)}
                      </h3>
                    )}
                    {typeof selectedGenre?.totalListeners === 'number' && (
                      <h3>
                        <span className="text-md text-muted-foreground">Listeners:</span>{' '}
                        {formatNumber(selectedGenre.totalListeners)}
                      </h3>
                    )}
                    {typeof selectedGenre?.totalPlays === 'number' && (
                      <h3>
                        <span className="text-md text-muted-foreground">Plays:</span>{' '}
                        {formatNumber(selectedGenre.totalPlays)}
                      </h3>
                    )}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default GenreCard;
