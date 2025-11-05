import { useEffect, useMemo, useState } from "react";
import { Artist } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer";
import { fixWikiImageURL, formatDate, formatNumber } from "@/lib/utils";
import { CirclePlay, SquarePlus, Ellipsis, Info, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import ReportIncorrectInfoDialog from "@/components/ReportIncorrectInfoDialog";
import { Alert, AlertDescription } from "./ui/alert";
import ArtistBadge from "@/components/ArtistBadge";
import GenreBadge from "@/components/GenreBadge";
import { AddButton } from "./AddButton";


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
  playLoading?: boolean;
  onArtistToggle: (id: string | undefined) => void;
  isInCollection: boolean;
  onDrawerSnapChange?: (isAtMinSnap: boolean) => void;
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
  playLoading,
  onArtistToggle,
  isInCollection,
  onDrawerSnapChange,
}: ArtistInfoProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
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

  const artistGenres = [
    { name: ''}
  ]


  if (!show) return null;

  return (
    <ResponsiveDrawer
      show={!!(show && selectedArtist)}
      onDismiss={onDismiss}
      bodyClassName=""
      snapPoints={[0.20, 0.50, 0.9]}
      minimizeOnCanvasTouch={true}
      contentKey={selectedArtist?.id}
      headerTitle={selectedArtist?.name}
      headerSubtitle={
        typeof selectedArtist?.listeners === "number"
          ? `${formatNumber(selectedArtist.listeners)} Listeners`
          : undefined
      }
    >
      {({ isDesktop, isAtMaxSnap, isAtMinSnap }) => {
        const isExpanded = isDesktop ? desktopExpanded : isAtMaxSnap;
        // Notify parent of drawer snap state changes for graph dimming
        useEffect(() => {
          onDrawerSnapChange?.(isAtMinSnap);
        }, [isAtMinSnap]);
        return (
          <>
            

            {/* Scrolling Container: allow scrolling at all snaps (mobile + desktop) */}
            <div
              data-drawer-scroll
              className={`w-full flex-1 min-h-0 flex flex-col gap-4 no-scrollbar pb-32 md:pb-16 
                ${isDesktop ? 'overflow-y-auto' : (isAtMinSnap ? 'overflow-hidden' : 'overflow-y-auto')}
              `}
            >
              {/* Thumbnail */}
              <div
                className={`w-full overflow-hidden border-b border-sidebar-border rounded-lg h-[200px] shrink-0 flex-none ${
                  isDesktop ? "" : "hidden"
                }`}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={selectedArtist?.name ?? "Artist image"}
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
              <div className="w-full flex flex-col gap-6">

                {/* Actions */}
                <div className={`flex  flex-col gap-6
                    ${isDesktop ? '' : 'flex-row items-center justify-between gap-3 mt-3'}`}>
                     <div className="flex gap-3 w-full">
                           <Button
                              size={isDesktop ? "lg" : "lg"}
                              variant="default"
                              // onClick={() => selectedArtist && allArtists(selectedArtist)}
                              className={`${isDesktop ? 'self-start' : 'flex-1'} disabled:opacity-100`}
                              onClick={() => selectedArtist && onPlay?.(selectedArtist)}
                              disabled={!!playLoading}
                              aria-busy={!!playLoading}
                              >
                              {playLoading ? <Loader2 className="animate-spin size-4" aria-hidden /> : <CirclePlay />}
                              Play
                            </Button>
                            {/* <AddButton
                              isDesktop={isDesktop}
                              onToggle={() => onArtistToggle(selectedArtist?.id)}
                              isInCollection={isInCollection}
                            /> */}
                           <Button
                              size={isDesktop ? "lg" : "lg"}
                              variant="secondary"
                              onClick={() => window.dispatchEvent(new Event('auth:open'))}
                              className={isDesktop ? 'self-start' : 'flex-1'}
                                                >
                              <SquarePlus size={24}/>Add
                            </Button>

                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                              size={isDesktop ? "lg" : "lg"}
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
                                setReportDialogOpen(true);
                              }}
                            >
                              <Flag />
                              Report Incorrect Information
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>

                        <ReportIncorrectInfoDialog
                          open={reportDialogOpen}
                          onOpenChange={setReportDialogOpen}
                          reasons={artistReasons}
                          description="Please let us know what information about this artist seems incorrect. Select a reason and provide any extra details if you’d like."
                          onSubmit={(reason, details) => onSubmitBadData(reason, details)}
                        />
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
                
                
                {/* <div
                  className={`flex gap-2 flex-col ${
                    isDesktop ? "gap-3" : ""
                  }`}
                >
                  <DrawerTitle className="lg:text-xl">{selectedArtist?.name}</DrawerTitle>
                  {!isDesktop && <Button
                      size="lg"
                      variant="secondary"
                      // onClick={console.log("Add Artist")}
                      className=''
                    >
                      <CirclePlay />Add Artist
                    </Button>}
                <p
                  onClick={() => isDesktop && setDesktopExpanded((prev) => !prev)}
                  className={`break-words text-muted-foreground ${
                    isDesktop
                      ? "cursor-pointer hover:text-gray-400"
                      : "cursor-default"
                  } ${isExpanded ? "text-muted-foreground" : "line-clamp-3 overflow-hidden"}`}
                >
                  {selectedArtist?.bio?.summary || "No bio"}
                </p>
                </div>
 */}

                {/* Mobile Thumbnail */}
                {!isDesktop && (
                  <div className="w-full overflow-hidden border-y border-sidebar-border rounded-lg h-[200px] shrink-0 flex-none">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={selectedArtist?.name ?? "Artist image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
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
                    <span className="text-md font-semibold">Similar Artists</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {similarFilter(selectedArtist.similar).map((name) => {
                        const img = getArtistImageByName?.(name);
                        const artistObj = getArtistByName?.(name);
                        const genreColor = artistObj ? getArtistColor(artistObj) : undefined;
                        return (
                          <ArtistBadge
                            key={name}
                            name={name}
                            imageUrl={img}
                            genreColor={genreColor}
                            onClick={() => setArtistFromName(name)}
                            title={`Go to ${name}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Genres */}
                {selectedArtist?.genres && selectedArtist.genres.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-md font-semibold">Genres</span>
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
                    <AlertDescription>Hmm… something about this artist’s info doesn’t sound quite right. We’re checking it out</AlertDescription>
                  </Alert>
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
