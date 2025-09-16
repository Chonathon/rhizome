import { BasicNode, Genre, Artist } from '@/types'
import {fixWikiImageURL, formatNumber} from '@/lib/utils'
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from './ui/button';
import useGenreArtists from "@/hooks/useGenreArtists";
import { SquareArrowUp, ChevronLeft, ChevronRight, Flag, Info } from 'lucide-react';
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge} from './ui/badge';
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer";
import ReportIncorrectInfoDialog from "@/components/ReportIncorrectInfoDialog";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";



interface GenreInfoProps {
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
  onBadDataSubmit: (id: string, reason: string, type: 'genre' | 'artist', hasFlag: boolean, details?: string) => Promise<boolean>;
  topArtists?: Artist[];
  getArtistImageByName?: (name: string) => string | undefined;
}

export function GenreInfo({
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
    onBadDataSubmit,
    topArtists,
    getArtistImageByName,
}: GenreInfoProps) {
  // On desktop, allow manual toggling of description; on mobile use snap state from panel
  const [desktopExpanded, setDesktopExpanded] = useState(true)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)


  const onDismiss = () => {
    deselectGenre()
  }

  const relatedLine = (label: string, nodes?: BasicNode[]) => {
    if (!nodes || nodes.length === 0) return null
    const items = nodes.slice(0, limitRelated)
    return (
      <div className="flex flex-col items-start gap-x-1.5 gap-3">
        <span className="text-md text-muted-foreground">{label}:</span>
        <div className='flex items-center gap-1.5 flex-wrap'>
          {items.map((node, i) => (
            <>
              {onLinkedGenreClick ? (
                <Badge asChild variant={'outline'} ><Button variant="ghost" size="sm" key={node.id} onClick={() => onLinkedGenreClick(node.id)}>{node.name}</Button></Badge>
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

  const initial = selectedGenre?.name?.[0]?.toUpperCase() ?? '?'

  // Prepare images for a bento carousel (desktop thumbnail area)
  const imageArtists = useMemo(
    () => (topArtists ?? []).filter(a => typeof a.image === 'string' && a.image.trim().length > 0),
    [topArtists]
  )

  const genreReasons = useMemo(() => [
                  { value: 'Name', label: 'Name', disabled: !selectedGenre?.name },
                  { value: 'Description', label: 'Description', disabled: !selectedGenre?.description },
                  {
                    value: 'Relationships',
                    label: 'Related/Subgenres/Influences',
                    disabled: !(
                      (selectedGenre?.subgenres?.length ?? 0) > 0 ||
                      (selectedGenre?.subgenre_of?.length ?? 0) > 0 ||
                      (selectedGenre?.influenced_by?.length ?? 0) > 0 ||
                      (selectedGenre?.influenced_genres?.length ?? 0) > 0 ||
                      (selectedGenre?.fusion_of?.length ?? 0) > 0
                    ),
                  },
                  { value: 'Top Artists', label: 'Top Artists', disabled: !topArtists || !topArtists.length },
                  {
                    value: 'Stats',
                    label: 'Stats',
                    disabled: !(
                      typeof selectedGenre?.artistCount === 'number' ||
                      typeof selectedGenre?.totalListeners === 'number' ||
                      typeof selectedGenre?.totalPlays === 'number'
                    ),
                  },
                  { value: 'Other', label: 'Other' },
                ], [selectedGenre?.name, selectedGenre?.description, selectedGenre?.subgenres, selectedGenre?.subgenre_of, selectedGenre?.influenced_by, selectedGenre?.influenced_genres, selectedGenre?.fusion_of, topArtists, selectedGenre?.artistCount, selectedGenre?.totalListeners, selectedGenre?.totalPlays])
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

  const onSubmitBadData = async (reason: string, details?: string) => {
    if (selectedGenre) {
      const success = await onBadDataSubmit(selectedGenre.id, reason, 'genre', selectedGenre.badDataFlag || false, details);
      if (success) {
        toast.success("Thanks for the heads up. We'll look into it soon!");
      }
    }
  }

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
    <ResponsiveDrawer
      show={!!(show && selectedGenre)}
      onDismiss={onDismiss}
      bodyClassName=""
      // snapPoints={[0.28, 0.9]}
      headerTitle={selectedGenre?.name}
      headerSubtitle={
        typeof selectedGenre?.totalListeners === 'number'
          ? `${formatNumber(selectedGenre.totalListeners)} Listeners`
          : undefined
      }
    >
      {({ isDesktop, isAtMaxSnap }) => {
        const isExpanded = isDesktop ? desktopExpanded : isAtMaxSnap;
        return (
          <>
            
            {/* TODO: fix bug that's forcing us to use all this extra padding on the scrolling container */}
            {/* Scrolling Container */}
            <div data-drawer-scroll className='w-full flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-32 md:pb-16'>
            
            {/* Thumbnail / Bento Carousel */}
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
                                  src={fixWikiImageURL(artist.image as string)}
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
            <div className="w-full flex flex-col gap-6">

                  <div className={`flex flex-row 
                    ${isDesktop ? 'gap-3' : 'items-center justify-between gap-3 mt-3'}`}>
                    
                    {!isDesktop && <Button
                      disabled={genreLoading}
                      size="xl"
                      variant="secondary"
                      onClick={() => selectedGenre && allArtists(selectedGenre)}
                      className='flex-1'
                    >
                      <SquareArrowUp />All Artists
                    </Button>}
                {isDesktop && (
                  <p
                    onClick={() => setDesktopExpanded((prev) => !prev)}
                    className={`break-words text-muted-foreground ${isDesktop ? 'cursor-pointer hover:text-gray-400' : 'cursor-default'} ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
                  >
                    {selectedGenre?.description || 'No description'}
                  </p>
                )}
                  </div>
                   {!isDesktop && (
                    <p
                      className={`break-words text-muted-foreground ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
                    >
                      {selectedGenre?.description || 'No description'}
                    </p>
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
                {/* Top Artists */}
                {topArtists && topArtists.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-md font-semibold">Top Artists</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                    {topArtists.map((artist) => {
                      const img = typeof artist.image === 'string' && artist.image.trim()
                        ? fixWikiImageURL(artist.image as string)
                        : undefined;
                      const initial = artist.name?.[0]?.toUpperCase() ?? '?';
                      return (
                        <Badge
                          key={artist.id}
                          asChild
                          variant="outline"
                          title={`${artist.listeners?.toLocaleString() ?? 0} listeners`}
                        >
                            <Button variant="ghost" size="sm" onClick={() => onTopArtistClick?.(artist)} className="cursor-pointer">
                            {img ? (
                              <img
                                src={img}
                                alt={`${artist.name} avatar`}
                                className="w-4 h-4 rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-muted text-[10px] leading-4 text-center">
                                {initial}
                              </span>
                            )}
                              {artist.name}
                            </Button>
                        </Badge>
                      );
                    })}
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

              {/* Bad Data Flag */}
              {selectedGenre && selectedGenre.badDataFlag && (
                <Alert>
                  <Info />
                  <AlertDescription>
                    Hmm… something about this genre’s info doesn’t sound quite right. We’re checking it out
                  </AlertDescription>
                </Alert>
              )}
              <div className='w-full pt-3 flex items-end'>
                <Button className='self-start' variant={'outline'} size={'lg'} onClick={() => setReportDialogOpen(true)}>
                  <Flag />Report Incorrect Information
                </Button>
              </div>

              {/* Report Incorrect Info Dialog */}
              <ReportIncorrectInfoDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                reasons={genreReasons}
                description="Please let us know what information about this genre seems incorrect. Select a reason and provide any extra details if you’d like."
                onSubmit={(reason, details) => onSubmitBadData(reason, details)}
              />
            </div>
          </div>
          </>
        )
      }}
    </ResponsiveDrawer>
  )
}

export default GenreInfo;
