import { useEffect, useMemo, useState } from "react";
import { Artist, TopTrack } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer";
import { fixWikiImageURL, formatDate, formatNumber } from "@/lib/utils";
import { CirclePlay, SquarePlus, Ellipsis, Info, Flag, Loader2, ChevronRight, ChevronDown, EyeOff, Disc3 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { SplitButton, SplitButtonAction, SplitButtonTrigger } from "@/components/ui/split-button"
import ReportIncorrectInfoDialog from "@/components/ReportIncorrectInfoDialog";
import { Alert, AlertDescription } from "./ui/alert";
import ArtistBadge from "@/components/ArtistBadge";
import GenreBadge from "@/components/GenreBadge";
import { AddButton } from "./AddButton";
import { Separator } from "@radix-ui/react-separator";
import { ImageLightbox } from "@/components/ImageLightbox";


interface ArtistInfoProps {
  selectedArtist?: Artist;
  show: boolean;
  artistLoading: boolean;
  artistError?: boolean;
  deselectArtist: () => void;
  setArtistFromName: (name: string) => void;
  similarFilter: (artists: string[]) => string[];
  onBadDataSubmit: (id: string, reason: string, type: 'genre' | 'artist', hasFlag: boolean, details?: string) => Promise<boolean>;
  onGenreClick?: (name: string) => void;
  getArtistImageByName?: (name: string) => string | undefined;
  getArtistByName?: (name: string) => Artist | undefined;
  genreColorMap?: Map<string, string>;
  getArtistColor: (artist: Artist) => string;
  getGenreNameById?: (id: string) => string | undefined;
  onPlay?: (artist: Artist) => void;
  onPreview?: (artist: Artist) => void;
  onFocusInArtistsView?: (artist: Artist, options?: { forceRefocus?: boolean }) => void;
  onViewArtistGraph?: (artist: Artist) => void;
  onViewSimilarArtistGraph?: (artist: Artist) => void;
  playLoading?: boolean;
  onArtistToggle: (id: string | undefined) => void;
  isInCollection: boolean;
  collectionMode: boolean;
  onPlayTrack?: (tracks: TopTrack[], startIndex: number, options?: { preview?: boolean }) => void;
  viewRelatedArtistsLoading?: boolean;
  shouldShowChevron?: boolean;
  onDrawerSnapChange?: (isAtMinSnap: boolean) => void;
  onCanvasDragStart?: () => void;
  onHeaderRefocus?: () => void;
  expandToMiddleTrigger?: number;
}

export function ArtistInfo({
  selectedArtist,
  show,
  artistLoading,
  artistError,
  deselectArtist,
  setArtistFromName,
  similarFilter,
  onBadDataSubmit,
  onGenreClick,
  getArtistImageByName,
  getArtistByName,
  genreColorMap,
  getArtistColor,
  getGenreNameById,
  onPlay,
  onPreview,
  onFocusInArtistsView,
  onViewArtistGraph,
  onViewSimilarArtistGraph,
  playLoading,
  onArtistToggle,
  isInCollection,
  collectionMode,
  onPlayTrack,
  viewRelatedArtistsLoading,
  shouldShowChevron,
  onDrawerSnapChange,
  onCanvasDragStart,
  onHeaderRefocus,
  expandToMiddleTrigger,
}: ArtistInfoProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [previewModeEnabled, setPreviewModeEnabled] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1200px)");


  const artistReasons = useMemo(
    () => [
      { value: "name", label: "Name", disabled: !selectedArtist?.name },
      { value: "image", label: "Image", disabled: !selectedArtist?.image },
      { value: "bio", label: "Description", disabled: !selectedArtist?.bio },
      {
        value: "similar",
        label: "Similar Artists",
        disabled: !(selectedArtist?.similar && selectedArtist.similar.length > 0),
      },
      { value: "startDate", label: "Founded Date", disabled: !selectedArtist?.startDate },
      {
        value: "tags",
        label: "Tags",
        disabled: !(selectedArtist?.tags && selectedArtist.tags.length > 0),
      },
      {
        value: "genres",
        label: "Genres",
        disabled: !(selectedArtist?.genres && selectedArtist.genres.length > 0),
      },
      { value: "other", label: "Other" },
    ],
    [
      selectedArtist?.name,
      selectedArtist?.image,
      selectedArtist?.bio,
      selectedArtist?.similar,
      selectedArtist?.startDate,
      selectedArtist?.tags,
      selectedArtist?.genres,
    ]
  );

  const onDismiss = () => {
    deselectArtist();
  };

  const initial = selectedArtist?.name?.[0]?.toUpperCase() ?? "?";

  // Single artist image handling (keep structure similar to GenreInfo thumbnail area)
  const imageUrl = useMemo(() => {
    const raw = selectedArtist?.image;
    return raw ? fixWikiImageURL(raw) : undefined;
  }, [selectedArtist?.image]);

  const onSubmitBadData = async (reason: string, details?: string) => {
    if (selectedArtist) {
      const success = await onBadDataSubmit(selectedArtist.id, reason, 'artist', selectedArtist.badDataFlag || false, details);
      if (success) {
        toast.success("Thanks for the heads up. We'll look into it soon!");
      }
    }
  }


  if (!show) return null;

  return (
    <ResponsiveDrawer
      show={!!(show && selectedArtist)}
      onDismiss={onDismiss}
      bodyClassName=""
      minimizeOnCanvasTouch={true}
      onCanvasDragStart={onCanvasDragStart}
      contentKey={selectedArtist?.id}
      expandToMiddleTrigger={expandToMiddleTrigger}
      headerTitle={
        selectedArtist && onFocusInArtistsView && shouldShowChevron ? (
          <button
            onClick={() => {
              onFocusInArtistsView(selectedArtist, { forceRefocus: true });
              onHeaderRefocus?.();
            }}
            className="hover:opacity-70 transition-opacity cursor-pointer text-left inline-block"
            title={selectedArtist ? `Go to ${selectedArtist.name}` : "Go to artist"}
          >
            <span className="whitespace-normal break-words leading-tight">
              {selectedArtist.name}
              <ChevronRight className="inline-block align-middle relative size-6 text-muted-foreground" />
            </span>
          </button>
        ) : (
          selectedArtist?.name
        )
      }
      headerSubtitle={
        typeof selectedArtist?.listeners === "number"
          ? `${formatNumber(selectedArtist.listeners)} Listeners`
          : undefined
      }
    >
      {({ isDesktop, isAtMaxSnap, isAtMinSnap }) => {
        // Notify parent of snap state changes for dimming control
        useEffect(() => {
          onDrawerSnapChange?.(!isDesktop && isAtMinSnap);
        }, [isAtMinSnap, isDesktop]);

        const isExpanded = isDesktop ? desktopExpanded : isAtMaxSnap;
        return (
          <>
            

            {/* Scrolling Container: allow scrolling at all snaps (mobile + desktop) */}
            <div
              data-drawer-scroll
              className={`w-full flex-1 min-h-0 flex flex-col gap-4 no-scrollbar pb-32 md:pb-16 
                ${isDesktop ? 'overflow-y-auto' : (isAtMaxSnap ? 'overflow-y-auto' : 'overflow-hidden')}
              `}
            >
              {/* Thumbnail */}
              <div
                className={`w-full overflow-hidden border-b border-sidebar-border rounded-lg h-[200px] shrink-0 flex-none ${
                  isDesktop ? "" : "hidden"
                }`}
              >
                {imageUrl ? (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="w-full h-full cursor-zoom-in focus:outline-none group"
                    title="Click to enlarge"
                  >
                    <img
                      src={imageUrl}
                      alt={selectedArtist?.name ?? "Artist image"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
                    <span className="text-4xl font-semibold">{initial}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="w-full flex flex-col gap-6">

                {/* Actions */}
                <div className={`flex  flex-col gap-6
                    ${isDesktop ? '' : 'flex-row items-center justify-between gap-3 mt-3'}`}>
                     <div className="flex gap-3 w-full">
                           {/* Desktop: Split button with play/preview action and track dropdown */}
                           {isDesktop ? (
                             <SplitButton
                               variant="default"
                               size="lg"
                               disabled={!!playLoading}
                             >
                               <SplitButtonAction
                                 aria-busy={!!playLoading}
                                 className="disabled:opacity-100"
                                 onClick={() => {
                                   if (selectedArtist) {
                                     if (previewModeEnabled) {
                                       onPreview?.(selectedArtist);
                                     } else {
                                       onPlay?.(selectedArtist);
                                     }
                                   }
                                 }}
                               >
                                 {playLoading ? (
                                   <Loader2 className="animate-spin size-4" aria-hidden />
                                 ) : previewModeEnabled ? (
                                   <Disc3 />
                                 ) : (
                                   <CirclePlay />
                                 )}
                                 {previewModeEnabled ? 'Preview' : 'Play'}
                               </SplitButtonAction>

                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <SplitButtonTrigger
                                     className="disabled:opacity-100"
                                     disabled={!!playLoading}
                                     aria-label="Select track or toggle preview mode"
                                   >
                                     <ChevronDown className="size-4" />
                                   </SplitButtonTrigger>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="start" className="w-[280px]">
                                   {/* Preview mode toggle */}
                                   <DropdownMenuItem
                                     onClick={() => setPreviewModeEnabled(!previewModeEnabled)}
                                     className="cursor-pointer"
                                   >
                                     {previewModeEnabled ? (
                                       <>
                                         <CirclePlay className="size-4" />
                                         <span>Switch to Play Mode</span>
                                       </>
                                     ) : (
                                       <>
                                         <Disc3 className="size-4" />
                                         <span>Switch to Preview Mode</span>
                                       </>
                                     )}
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuLabel>Top Tracks</DropdownMenuLabel>
                                   {/* <DropdownMenuSeparator /> */}
                                   {selectedArtist?.topTracks && selectedArtist.topTracks.length > 0 ? (
                                     selectedArtist.topTracks.map((track, index) => (
                                       <DropdownMenuItem
                                         key={`${track.title}-${index}`}
                                         onClick={() => selectedArtist.topTracks && onPlayTrack?.(selectedArtist.topTracks, index, { preview: previewModeEnabled })}
                                         className="cursor-pointer group"
                                       >
                                         <span className="relative grid place-items-center size-4">
                                           {previewModeEnabled ? (
                                             <Disc3
                                               className="absolute opacity-0 group-hover:opacity-100 size-4"
                                               aria-hidden
                                             />
                                           ) : (
                                             <CirclePlay
                                               className="absolute opacity-0 group-hover:opacity-100 size-4"
                                               aria-hidden
                                             />
                                           )}
                                           <span className="text-sm text-muted-foreground text-center leading-none opacity-100 group-hover:opacity-0">
                                             {index + 1}
                                           </span>
                                         </span>
                                         <div className="flex flex-col flex-1 min-w-0">
                                           <span className="text-sm font-medium truncate">{track.title}</span>
                                           <span className="text-xs text-muted-foreground truncate">{track.artistName}</span>
                                         </div>
                                       </DropdownMenuItem>
                                     ))
                                   ) : (
                                     <DropdownMenuItem disabled>
                                       No tracks available
                                     </DropdownMenuItem>
                                   )}
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </SplitButton>
                           ) : (
                             // Mobile: Simple play button
                             <Button
                               size="xl"
                               variant="default"
                               className="flex-1 disabled:opacity-100"
                               onClick={() => selectedArtist && onPlay?.(selectedArtist)}
                               disabled={!!playLoading}
                               aria-busy={!!playLoading}
                             >
                               {playLoading ? <Loader2 className="animate-spin size-4" aria-hidden /> : <CirclePlay />}
                               Play
                             </Button>
                           )}
                            <AddButton
                              isDesktop={isDesktop}
                              onToggle={() => onArtistToggle(selectedArtist?.id)}
                              isInCollection={isInCollection}
                            />
                           {/* <Button
                              size={isDesktop ? "lg" : "xl"}
                              variant="secondary"
                              onClick={() => window.dispatchEvent(new Event('auth:open'))}
                              className={isDesktop ? 'self-start' : 'flex-1'}
                                                >
                              <SquarePlus size={24}/>Add
                            </Button> */}

                       {/* <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                              size={isDesktop ? "lg" : "xl"}
                              variant="secondary"
                              // onClick={() => selectedArtist && allArtists(selectedArtist)}
                              className={isDesktop ? 'self-start' : 'flex-1'}
                              >
                              <Ellipsis size={24}/>More
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent>
                            <DropdownMenuItem
                              onSelect={() => {
                                onViewArtistGraph
                              }}
                            >
                              View Genres
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu> */}
                     </div>
                {/* Description */}
                {isDesktop && (
                  <button className='text-left'
                  type="button"
                  aria-label={desktopExpanded ? 'Collapse' : 'Expand'}
                  title={desktopExpanded ? 'Collapse' : 'Expand'}
                  onClick={() => setDesktopExpanded((prev) => !prev)}
                  >
                    <p className={`break-words text-muted-foreground ${isDesktop ? 'cursor-pointer hover:text-muted-foreground/80' : 'cursor-default'} ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
                    >
                      {selectedArtist?.bio?.summary || 'No description'}
                    </p>
                  </button>
                )}
                  </div>
                   {!isDesktop && (
                     <p
                     className={`break-words text-muted-foreground ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
                     >
                      {selectedArtist?.bio?.summary || 'No description'}
                    </p>
                   )}
                
                
                {/* Top Tracks V2*/}
                  {/* {selectedArtist?.topTracks && selectedArtist.topTracks.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-md font-semibold">Top Tracks</span>
                      <div className="flex flex-col gap-1.5">
                        {selectedArtist.topTracks.map((track, index) => (
                          <button
                            key={`${track.title}-${index}`}
                            onClick={() => selectedArtist.topTracks && onPlayTrack?.(selectedArtist.topTracks, index)}
                            className="group flex items-center gap-2 py-2 hover:bg-accent rounded-md transition-colors text-left group"
                            title={`Play ${track.title}`}
                          >
                            <div className="flex-1 gap-1 min-w-0 flex items-center">
                            <span className="relative grid place-items-center size-5">
                              <CirclePlay
                                className="absolute opacity-0 group-hover:opacity-100"
                                size={16}
                                aria-hidden
                              />
                              <span className="text-sm text-muted-foreground text-center leading-none opacity-100">
                                {index + 1}
                              </span>
                            </span>
                              <div className="text-sm group-hover:text-muted-foreground font-medium truncate">{track.title}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )} */}

                {/* Mobile Thumbnail */}
                {!isDesktop && (
                  <div className="w-full overflow-hidden border-y border-sidebar-border rounded-lg h-[200px] shrink-0 flex-none">
                    {imageUrl ? (
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="w-full h-full cursor-zoom-in focus:outline-none"
                        title="Tap to enlarge"
                      >
                        <img
                          src={imageUrl}
                          alt={selectedArtist?.name ?? "Artist image"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
                        <span className="text-4xl font-semibold">{initial}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}

                {/* Similar Artists */}
                {selectedArtist?.similar && similarFilter(selectedArtist.similar).length > 0 && (
                  <div className="flex flex-col gap-2">
                    {onViewSimilarArtistGraph && selectedArtist ? (
                      <button
                        className="hover:opacity-70 transition-opacity cursor-pointer text-left inline-flex items-center flex-wrap"
                        onClick={() => onViewSimilarArtistGraph(selectedArtist)}
                        title={`Explore artists similar to ${selectedArtist.name}`}
                      >
                        <span className="text-md font-semibold">Similar Artists</span>
                        <ChevronRight className="shrink-0 text-muted-foreground size-5"/>
                      </button>
                    ) : (
                      <span className="text-md font-semibold">Similar Artists</span>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {similarFilter(selectedArtist.similar).map((name) => {
                        const artistObj = getArtistByName?.(name);
                        const isInView = !!artistObj;
                        const img = getArtistImageByName?.(name);
                        const genreColor = artistObj ? getArtistColor(artistObj) : undefined;

                        return (
                          // TODO: Provide navigation options for artists not in view
                          <ArtistBadge
                            key={name}
                            name={name}
                            imageUrl={isInView ? img : undefined}
                            genreColor={genreColor}
                            onClick={() => {
                              if (isInView) {
                                setArtistFromName(name);
                              } else {
                                toast.info(`${name} is not in the current view.`);
                              }
                            }}
                            title={!isInView ? `${name} is not in the current view` : `Go to ${name}`}
                            icon={!isInView ? EyeOff : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Genres */}
                {selectedArtist?.genres && selectedArtist.genres.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {onViewArtistGraph && selectedArtist ? (
                      <button
                        className="hover:opacity-70 transition-opacity cursor-pointer text-left inline-flex items-center flex-wrap"
                        onClick={() => onViewArtistGraph(selectedArtist)}
                        type="button"
                        disabled={viewRelatedArtistsLoading}
                        title={`Explore Related Genres for ${selectedArtist.name}`}
                      >
                        <span className="text-md font-semibold">Explore Related Genres</span>
                        <ChevronRight className="shrink-0 text-muted-foreground size-5" />
                      </button>
                    ) : (
                      <span className="text-md font-semibold">Genres</span>
                    )}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      {selectedArtist.genres.map((genreId) => {
                        const name = getGenreNameById?.(genreId) ?? genreId;
                        const key = `${genreId}`;
                        const genreColor = genreColorMap?.get(genreId);
                        return (
                          <>
                            {onGenreClick && (
                              <GenreBadge
                                key={key}
                                name={name}
                                genreColor={genreColor}
                                onClick={() => onGenreClick(name)}
                                title={`Go to ${name}`}
                              />
                            )}
                          </>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-col gap-2">
                  <span className="text-md font-semibold">Stats</span>
                  {typeof selectedArtist?.listeners === "number" && (
                    <h3>
                      <span className="text-md text-muted-foreground">Listeners:</span>{" "}
                      {formatNumber(selectedArtist.listeners)}
                    </h3>
                  )}
                  {typeof selectedArtist?.playcount === "number" && (
                    <h3>
                      <span className="text-md text-muted-foreground">Plays:</span>{" "}
                      {formatNumber(selectedArtist.playcount)}
                    </h3>
                  )}
                  <h3>
                    <span className="text-md text-muted-foreground">Founded:</span>{" "}
                    {selectedArtist?.startDate ? formatDate(selectedArtist.startDate) : "Unknown"}
                  </h3>
                </div>

                {/* Error state inline (mirroring GenreInfo pattern) */}
                {artistError && (
                  <p>Can’t find {selectedArtist?.name} 🤔</p>
                )}

              {/* Bad Data Flag */}
              {selectedArtist && selectedArtist.badDataFlag && (
                  <Alert>
                    <Info />
                    <AlertDescription>Hmm… something about this artist's info doesn't sound quite right. We're checking it out</AlertDescription>
                  </Alert>
              )}
              <div className='w-full pt-8 flex items-end'>
                <Button className='self-start' variant={'link'} size={'lg'} onClick={() => setReportDialogOpen(true)}>
                  <Flag />Report Incorrect Information
                </Button>
              </div>

              {/* Report Incorrect Info Dialog */}
              <ReportIncorrectInfoDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                reasons={artistReasons}
                description="Please let us know what information about this artist seems incorrect. Select a reason and provide any extra details if you'd like."
                onSubmit={(reason, details) => onSubmitBadData(reason, details)}
              />

              {/* Image Lightbox */}
              {imageUrl && (
                <ImageLightbox
                  src={imageUrl}
                  alt={selectedArtist?.name ?? "Artist image"}
                  open={lightboxOpen}
                  onOpenChange={setLightboxOpen}
                  // link={<div><a href={imageUrl} target="_blank" rel="noopener noreferrer" className="underline">Open image in new tab</a></div>}
                />
              )}
              </div>
            </div>
          </>
        );
      }}
    </ResponsiveDrawer>
  );
}

export default ArtistInfo;
