import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Gem, Heart, Link, Loader2, Map, Radio, Shuffle, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { Artist } from "@/types";
import { Button } from "@/components/ui/button";
import ArtistAvatar from "@/components/ArtistAvatar";
import { clientUrl, cn, fixWikiImageURL, formatNumberCompact } from "@/lib/utils";

// A next stop counts as a "hidden gem" when it has an order of magnitude fewer listeners than the current stop
const HIDDEN_GEM_RATIO = 10;

interface JourneyPanelProps {
    show: boolean;
    path: Artist[];
    nextStop?: Artist;
    optionsLoading: boolean;
    isInCollection: (id?: string) => boolean;
    getArtistColor: (artist: Artist) => string;
    onLikeCurrent: () => void;
    onAdvance: () => void;
    onShuffle: () => void;
    onEnd: () => void;
    /** Shown when the user is exploring another graph — returns to the journey map */
    onShowJourney?: () => void;
}

/**
 * Radio mode companion bar: compact pill showing the current stop (with like),
 * the single proposed next stop (advance / shuffle), and journey controls.
 * Stays visible while exploring other graph views so the radio keeps playing.
 */
export function JourneyPanel({
    show,
    path,
    nextStop,
    optionsLoading,
    isInCollection,
    getArtistColor,
    onLikeCurrent,
    onAdvance,
    onShuffle,
    onEnd,
    onShowJourney,
}: JourneyPanelProps) {
    const [copied, setCopied] = useState(false);
    const currentStop = path[path.length - 1];
    if (!show || !currentStop) return null;

    const currentLiked = isInCollection(currentStop.id);
    const isGem =
        !!nextStop &&
        Math.max(1, nextStop.listeners || 1) * HIDDEN_GEM_RATIO <= Math.max(1, currentStop.listeners || 1);

    const handleCopyUrl = async () => {
        const shareUrl = clientUrl() + window.location.search;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Journey link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-[94vw]"
        >
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 rounded-2xl border border-sidebar-border bg-background/90 backdrop-blur-md shadow-lg pl-3 pr-1.5 py-1.5">
                <Radio className="size-4 text-amber-500 shrink-0" aria-hidden />

                {/* Current stop */}
                <div className="flex items-center gap-2 min-w-0">
                    <ArtistAvatar
                        name={currentStop.name}
                        imageUrl={currentStop.image ? fixWikiImageURL(currentStop.image) : undefined}
                        color={getArtistColor(currentStop)}
                        className="size-7 border"
                    />
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-xs font-semibold truncate max-w-[130px]">{currentStop.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                            {path.length} {path.length === 1 ? "stop" : "stops"}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={onLikeCurrent}
                        title={currentLiked ? "Remove from collection" : "Like this artist"}
                        aria-label={currentLiked ? "Remove from collection" : "Like this artist"}
                    >
                        <Heart className={cn("size-4", currentLiked && "fill-current text-amber-500")} />
                    </Button>
                </div>

                <span className="hidden sm:block h-5 w-px bg-sidebar-border" aria-hidden />

                {/* Next stop */}
                {optionsLoading ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                        <Loader2 className="size-3.5 animate-spin" />
                        Finding next stop…
                    </span>
                ) : nextStop ? (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onAdvance}
                            title={`Travel to ${nextStop.name}`}
                            className="group flex items-center gap-2 rounded-lg px-1.5 py-0.5 min-w-0 hover:bg-accent transition-colors"
                        >
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                                Next
                            </span>
                            <ArtistAvatar
                                name={nextStop.name}
                                imageUrl={nextStop.image ? fixWikiImageURL(nextStop.image) : undefined}
                                color={getArtistColor(nextStop)}
                                className="size-7 border"
                            />
                            <div className="flex flex-col leading-tight min-w-0 text-left">
                                <span className="text-xs font-semibold truncate max-w-[130px] flex items-center gap-1">
                                    {nextStop.name}
                                    {isGem && <Gem className="size-3 text-amber-500 shrink-0" aria-label="Hidden gem" />}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {formatNumberCompact(nextStop.listeners || 0)} listeners
                                </span>
                            </div>
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                        className="size-8"
                            onClick={onShuffle}
                            title="Suggest someone else"
                            aria-label="Suggest someone else"
                        >
                            <Shuffle className="size-4" />
                        </Button>
                        <Button
                            variant="default"
                            size="icon"
                        className="size-8"
                            onClick={onAdvance}
                            title={`Travel to ${nextStop.name}`}
                            aria-label={`Travel to ${nextStop.name}`}
                        >
                            <SkipForward className="size-4" />
                        </Button>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground px-1">End of the line — no connections left to hop to</span>
                )}

                <span className="hidden sm:block h-5 w-px bg-sidebar-border" aria-hidden />

                {/* Journey controls */}
                <div className="flex items-center">
                    {onShowJourney && (
                        <Button
                            variant="ghost"
                            size="icon"
                        className="size-8"
                            onClick={onShowJourney}
                            title="Back to journey map"
                            aria-label="Back to journey map"
                        >
                            <Map className="size-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={handleCopyUrl}
                        title="Copy journey link"
                        aria-label="Copy journey link"
                    >
                        {copied ? <Check className="size-4" /> : <Link className="size-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={onEnd}
                        title="End journey"
                        aria-label="End journey"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default JourneyPanel;
