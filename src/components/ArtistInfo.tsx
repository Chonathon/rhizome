import { useEffect, useMemo, useState } from "react";
import { Artist } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer";
import { fixWikiImageURL, formatDate, formatNumber } from "@/lib/utils";
import { CirclePlay, SquarePlus, Ellipsis, Info, Flag } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";


interface ArtistInfoProps {
  selectedArtist?: Artist;
  show: boolean;
  artistLoading: boolean;
  artistError?: boolean;
  deselectArtist: () => void;
  setArtistFromName: (name: string) => void;
  similarFilter: (artists: string[]) => string[];
  onBadDataClick: () => void;
}

export function ArtistInfo({
  selectedArtist,
  show,
  artistLoading,
  artistError,
  deselectArtist,
  setArtistFromName,
  similarFilter,
  onBadDataClick,
}: ArtistInfoProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  // Track bad data report state; must be declared before any conditional returns
  const [badDataFlag, setBadDataFlag] = useState(false);

  const onDismiss = () => {
    deselectArtist();
  };

  const initial = selectedArtist?.name?.[0]?.toUpperCase() ?? "?";

  // Single artist image handling (keep structure similar to GenreInfo thumbnail area)
  const imageUrl = useMemo(() => {
    const raw = selectedArtist?.image;
    return raw ? fixWikiImageURL(raw) : undefined;
  }, [selectedArtist?.image]);

  // Reset expansion when artist changes
  useEffect(() => {
    setDesktopExpanded(true);
    // TODO: REMOVE AFTER IMPLEMENTING BACKEND. Resets the bad data flag when switching artists so it stays scoped
    setBadDataFlag(false);
  }, [selectedArtist?.id]);

  if (!show) return null;

  return (
    <ResponsiveDrawer
      show={!!(show && selectedArtist)}
      onDismiss={onDismiss}
      bodyClassName=""
      // snapPoints={[0.28, 0.9]}
      headerTitle={selectedArtist?.name}
      headerSubtitle={
        typeof selectedArtist?.listeners === "number"
          ? `${formatNumber(selectedArtist.listeners)} Listeners`
          : undefined
      }
    >
      {({ isDesktop, isAtMaxSnap }) => {
        const isExpanded = isDesktop ? desktopExpanded : isAtMaxSnap;
        return (
          <>
            

            {/* Scrolling Container */}
            <div data-drawer-scroll className="w-full flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto no-scrollbar">
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
                              size={isDesktop ? "lg" : "xl"}
                              variant="default"
                              // onClick={() => selectedArtist && allArtists(selectedArtist)}
                              className={isDesktop ? 'self-start' : 'flex-1'}
                              onClick={() => (
                                toast("Playing Artist...")
                              )}
                              >
                              <CirclePlay size={24}/>Play
                            </Button>
                           <Button
                              size={isDesktop ? "lg" : "xl"}
                              variant="secondary"
                              // onClick={() => selectedArtist && allArtists(selectedArtist)}
                              className={isDesktop ? 'self-start' : 'flex-1'}
                                                >
                              <SquarePlus size={24}/>Add
                            </Button>
                              
                       <DropdownMenu>
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
                                setReportDialogOpen(true);
                              }}
                            >
                              <Flag />
                              Report Incorrect Information
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>

                        {/* Report Dialog */}
                        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                          <DialogContent className="bg-sidebar backdrop-blur-sm">
                              <DialogHeader>                
                                  <DialogTitle>Report Incorrect Information</DialogTitle>
                                  <DialogDescription>Please let us know what information about this artist seems incorrect. 
                                  Select a reason and provide any extra details if you’d like.
                                  </DialogDescription>
                              </DialogHeader>
                            <form className="grid gap-4 py-3">
                              <div className="grid gap-2">
                                <label
                                  htmlFor="reason"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Reason
                                </label>
                                <Select>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel className="sr-only">Reasons</SelectLabel>
                                        <SelectItem value="Inforrect information">Inforrect information</SelectItem>
                                      </SelectGroup>
                                      
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label
                                  htmlFor="details"
                                  className="text-sm font-medium"
                                >
                                Details (optional)
                                </Label> 
                                <Textarea
                                 id="details"
                                placeholder="Additional details...">
                                   
                                </Textarea>
                              </div>
                            </form>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button
                                  variant="outline"
                                  >
                                  Cancel
                                </Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button
                                  type="submit"
                                onClick={() => {  
                                  toast.success("Thanks for the heads up. We'll look into it soon!"); setReportDialogOpen(false);
                                  setBadDataFlag(true);
                                
                                }}
                                  >
                                  Submit
                                </Button>
                              </DialogClose>
                            </DialogFooter>



                          </DialogContent>
                        </Dialog>
                     </div>
                {/* Description */}
                {isDesktop && (
                  <p
                  onClick={() => setDesktopExpanded((prev) => !prev)}
                  className={`break-words text-muted-foreground ${isDesktop ? 'cursor-pointer hover:text-gray-400' : 'cursor-default'} ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
                  >
                    {selectedArtist?.bio?.summary || 'No description'}
                  </p>
                )}
                  </div>
                  {badDataFlag && <Alert><Info /><AlertDescription>Hmm… something about this artist’s info doesn’t sound quite right. We’re checking it out</AlertDescription></Alert>}
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
                {selectedArtist?.similar && selectedArtist.similar.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-md font-semibold">Similar Artists</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {similarFilter(selectedArtist.similar).map((name) => (
                        <Badge key={name} asChild variant="outline" title={`Go to ${name}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setArtistFromName(name)}
                            className="cursor-pointer"
                          >
                            {name}
                          </Button>
                        </Badge>
                      ))}
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
              </div>
            </div>
          </>
        );
      }}
    </ResponsiveDrawer>
  );
}

export default ArtistInfo;
