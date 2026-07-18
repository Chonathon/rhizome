import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Bookmark, Check, Gem, Heart, Link, Loader2, Map, Play, Radio, Shuffle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Artist } from "@/types";
import { Button } from "@/components/ui/button";
import ArtistAvatar from "@/components/ArtistAvatar";
import { useSidebar } from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SavedRadio } from "@/hooks/useJourney";
import { clientUrl, cn, fixWikiImageURL, formatNumberCompact } from "@/lib/utils";

// A next stop counts as a "hidden gem" when it has an order of magnitude fewer listeners than the current stop
const HIDDEN_GEM_RATIO = 10;

interface JourneyPanelProps {
    active: boolean;
    path: Artist[];
    nextStop?: Artist;
    optionsLoading: boolean;
    savedRadios: SavedRadio[];
    isInCollection: (id?: string) => boolean;
    getArtistColor: (artist: Artist) => string;
    onLikeCurrent: () => void;
    onAdvance: () => void;
    onShuffle: () => void;
    onEnd: () => void;
    onSave: () => boolean;
    onDeleteSaved: (id: string) => void;
    onResumeSaved: (saved: SavedRadio) => void;
    /** Shown in the floating variant when the user is exploring another graph — returns to the journey map */
    onShowJourney?: () => void;
}

function NextStopRow({
    nextStop,
    optionsLoading,
    isGem,
    getArtistColor,
    onAdvance,
    onShuffle,
}: Pick<JourneyPanelProps, "nextStop" | "optionsLoading" | "getArtistColor" | "onAdvance" | "onShuffle"> & { isGem: boolean }) {
    if (optionsLoading) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 py-1">
                <Loader2 className="size-3.5 animate-spin" />
                Finding next stop…
            </span>
        );
    }
    if (!nextStop) {
        return (
            <span className="text-xs text-muted-foreground px-1 py-1">
                End of the line — no connections left to hop to
            </span>
        );
    }
    return (
        <div className="flex items-center gap-1 min-w-0">
            <button
                onClick={onAdvance}
                title={`Travel to ${nextStop.name}`}
                className="group flex flex-1 items-center gap-2 rounded-lg px-1.5 py-0.5 min-w-0 hover:bg-accent transition-colors"
            >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">Next</span>
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
                className="size-8 shrink-0"
                onClick={onShuffle}
                title="Suggest someone else"
                aria-label="Suggest someone else"
            >
                <Shuffle className="size-4" />
            </Button>
        </div>
    );
}

/**
 * Radio mode UI. On desktop with the sidebar expanded it docks as a section
 * above the player (portal into #sidebar-radio-slot), including the saved
 * radios list; when the sidebar is collapsed or on mobile it falls back to a
 * compact floating pill so the journey stays controllable everywhere.
 * Clicking the next-stop row advances the journey (the player's Next button
 * covers lean-back skipping, so there's no separate skip button here).
 */
export function JourneyPanel({
    active,
    path,
    nextStop,
    optionsLoading,
    savedRadios,
    isInCollection,
    getArtistColor,
    onLikeCurrent,
    onAdvance,
    onShuffle,
    onEnd,
    onSave,
    onDeleteSaved,
    onResumeSaved,
    onShowJourney,
}: JourneyPanelProps) {
    const [copied, setCopied] = useState(false);
    const { state: sidebarState } = useSidebar();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const docked = isDesktop && sidebarState === "expanded";
    const [slot, setSlot] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setSlot(document.getElementById("sidebar-radio-slot"));
    }, [docked]);

    const currentStop = path[path.length - 1];
    const currentLiked = !!currentStop && isInCollection(currentStop.id);
    const isGem =
        !!nextStop &&
        !!currentStop &&
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

    const handleSave = () => {
        if (onSave()) toast.success("Radio saved");
    };

    // Docked in the sidebar: full section with saved radios, shown even between journeys
    if (docked && slot) {
        if (!active && !savedRadios.length) return null;
        return createPortal(
            <div className="px-2 pb-2">
                <div className="rounded-xl border border-sidebar-border bg-background/60 p-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                            <Radio className="size-3.5 text-amber-500" />
                            Radio
                        </span>
                        {active && (
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="size-7" onClick={handleSave} title="Save radio" aria-label="Save radio">
                                    <Bookmark className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-7" onClick={handleCopyUrl} title="Copy journey link" aria-label="Copy journey link">
                                    {copied ? <Check className="size-3.5" /> : <Link className="size-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="size-7" onClick={onEnd} title="End journey" aria-label="End journey">
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {active && currentStop && (
                        <>
                            <div className="flex items-center gap-2 min-w-0">
                                <ArtistAvatar
                                    name={currentStop.name}
                                    imageUrl={currentStop.image ? fixWikiImageURL(currentStop.image) : undefined}
                                    color={getArtistColor(currentStop)}
                                    className="size-8 border"
                                />
                                <div className="flex flex-col leading-tight min-w-0 flex-1">
                                    <span className="text-xs font-semibold truncate">{currentStop.name}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">
                                        {path.length} {path.length === 1 ? "stop" : "stops"} · from {path[0].name}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    onClick={onLikeCurrent}
                                    title={currentLiked ? "Remove from collection" : "Like this artist"}
                                    aria-label={currentLiked ? "Remove from collection" : "Like this artist"}
                                >
                                    <Heart className={cn("size-4", currentLiked && "fill-current text-amber-500")} />
                                </Button>
                            </div>
                            <NextStopRow
                                nextStop={nextStop}
                                optionsLoading={optionsLoading}
                                isGem={isGem}
                                getArtistColor={getArtistColor}
                                onAdvance={onAdvance}
                                onShuffle={onShuffle}
                            />
                        </>
                    )}

                    {savedRadios.length > 0 && (
                        <div className={cn("flex flex-col gap-0.5", active && "border-t border-sidebar-border pt-1.5")}>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                                Saved radios
                            </span>
                            {savedRadios.map((saved) => (
                                <div key={saved.id} className="group flex items-center gap-1 min-w-0">
                                    <button
                                        onClick={() => onResumeSaved(saved)}
                                        title={`Resume ${saved.name} radio`}
                                        className="flex flex-1 items-center gap-1.5 rounded-md px-1 py-1 min-w-0 hover:bg-accent transition-colors text-left"
                                    >
                                        <Play className="size-3 shrink-0 text-muted-foreground" />
                                        <span className="text-xs truncate">{saved.name}</span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                            · {saved.stops} {saved.stops === 1 ? "stop" : "stops"}
                                        </span>
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                                        onClick={() => onDeleteSaved(saved.id)}
                                        title="Delete saved radio"
                                        aria-label={`Delete ${saved.name} radio`}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>,
            slot,
        );
    }

    // Floating pill: sidebar collapsed or mobile — only while a journey is running
    if (!active || !currentStop) return null;

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

                <NextStopRow
                    nextStop={nextStop}
                    optionsLoading={optionsLoading}
                    isGem={isGem}
                    getArtistColor={getArtistColor}
                    onAdvance={onAdvance}
                    onShuffle={onShuffle}
                />

                <span className="hidden sm:block h-5 w-px bg-sidebar-border" aria-hidden />

                {/* Journey controls */}
                <div className="flex items-center">
                    {onShowJourney && (
                        <Button variant="ghost" size="icon" className="size-8" onClick={onShowJourney} title="Back to journey map" aria-label="Back to journey map">
                            <Map className="size-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-8" onClick={handleSave} title="Save radio" aria-label="Save radio">
                        <Bookmark className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={handleCopyUrl} title="Copy journey link" aria-label="Copy journey link">
                        {copied ? <Check className="size-4" /> : <Link className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={onEnd} title="End journey" aria-label="End journey">
                        <X className="size-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default JourneyPanel;
