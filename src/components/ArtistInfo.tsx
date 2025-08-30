import { useEffect, useMemo, useState } from "react";
import { Artist } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer";
import { fixWikiImageURL, formatDate, formatNumber } from "@/lib/utils";
import { X } from "lucide-react";

interface ArtistInfoProps {
  selectedArtist?: Artist;
  show: boolean;
  artistLoading: boolean;
  artistError?: boolean;
  deselectArtist: () => void;
  setArtistFromName: (name: string) => void;
  similarFilter: (artists: string[]) => string[];
}

export function ArtistInfo({
  selectedArtist,
  show,
  artistLoading,
  artistError,
  deselectArtist,
  setArtistFromName,
  similarFilter,
}: ArtistInfoProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const isSmallScreen = useMediaQuery("(min-width: 768px)");

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
  }, [selectedArtist?.id]);

  if (!show) return null;

  return (
    <ResponsiveDrawer
      show={!!(show && selectedArtist)}
      onDismiss={onDismiss}
      bodyClassName=""
      snapPoints={[0.28, 0.9]}
    >
      {({ isDesktop, isAtMaxSnap }) => {
        const isExpanded = isDesktop ? desktopExpanded : isAtMaxSnap;
        return (
          <>
            {/* Close button */}
            {isDesktop && isSmallScreen && (
              <div className="flex justify-end -mx-2.5 -mb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  aria-label="Close artist"
                  disabled={artistLoading}
                >
                  <X />
                </Button>
              </div>
            )}

            {/* Scrolling Container */}
            <div className="w-full flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto no-scrollbar">
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
                <div
                  className={`flex ${
                    isDesktop ? "flex-col gap-3" : "flex-row items-center justify-between"
                  }`}
                >
                  <DrawerTitle className="lg:text-xl">{selectedArtist?.name}</DrawerTitle>
                </div>

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
