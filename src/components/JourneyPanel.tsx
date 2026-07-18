import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Gem, Heart, Link, Loader2, Radio, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { Artist } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ArtistAvatar from "@/components/ArtistAvatar";
import { clientUrl, cn, fixWikiImageURL, formatNumberCompact } from "@/lib/utils";

// An option counts as a "hidden gem" when it has an order of magnitude fewer listeners than the current stop
const HIDDEN_GEM_RATIO = 10;

interface JourneyPanelProps {
    show: boolean;
    path: Artist[];
    options: Artist[];
    optionsLoading: boolean;
    isInCollection: (id?: string) => boolean;
    getArtistColor: (artist: Artist) => string;
    onLikeCurrent: () => void;
    onSkip: () => void;
    onChoose: (artist: Artist) => void;
    onEnd: () => void;
}

/**
 * Radio mode overlay: shows the journey so far, the current stop with
 * like/skip controls, and the 3-4 proposed next stops (weighted toward
 * lesser-known artists). Choosing a stop advances the journey.
 */
export function JourneyPanel({
    show,
    path,
    options,
    optionsLoading,
    isInCollection,
    getArtistColor,
    onLikeCurrent,
    onSkip,
    onChoose,
    onEnd,
}: JourneyPanelProps) {
    const [copied, setCopied] = useState(false);
    const currentStop = path[path.length - 1];
    if (!show || !currentStop) return null;

    const currentLiked = isInCollection(currentStop.id);
    const currentListeners = Math.max(1, currentStop.listeners || 1);

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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,540px)]"
        >
            <div className="rounded-xl border border-sidebar-border bg-background/90 backdrop-blur-md shadow-lg p-3 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Radio className="size-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold truncate">
                            Radio · {path.length} {path.length === 1 ? "stop" : "stops"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            from {path[0].name}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyUrl}
                            title="Copy journey link"
                            aria-label="Copy journey link"
                        >
                            {copied ? <Check className="size-4" /> : <Link className="size-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onEnd}
                            title="End journey"
                            aria-label="End journey"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Current stop */}
                <div className="flex items-center gap-3">
                    <ArtistAvatar
                        name={currentStop.name}
                        imageUrl={currentStop.image ? fixWikiImageURL(currentStop.image) : undefined}
                        color={getArtistColor(currentStop)}
                        className="size-11 border-2"
                        labelClassName="text-base"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold truncate">{currentStop.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatNumberCompact(currentStop.listeners || 0)} listeners
                        </span>
                    </div>
                    <Button
                        variant={currentLiked ? "default" : "outline"}
                        size="sm"
                        onClick={onLikeCurrent}
                        title={currentLiked ? "Remove from collection" : "Like this artist"}
                    >
                        <Heart className={cn("size-4", currentLiked && "fill-current")} />
                        {currentLiked ? "Liked" : "Like"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSkip}
                        disabled={optionsLoading || options.length === 0}
                        title="Skip to a suggested next stop"
                    >
                        <SkipForward className="size-4" />
                        Skip
                    </Button>
                </div>

                {/* Next stops */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Next stops
                    </span>
                    {optionsLoading ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Finding where to go next…
                        </div>
                    ) : options.length === 0 ? (
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">
                                Dead end — no unvisited similar artists found.
                            </span>
                            <Button variant="outline" size="sm" onClick={onEnd}>
                                End journey
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <AnimatePresence initial={false} mode="popLayout">
                                {options.map((option) => {
                                    const isGem =
                                        Math.max(1, option.listeners || 1) * HIDDEN_GEM_RATIO <= currentListeners;
                                    return (
                                        <motion.button
                                            key={option.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.18 }}
                                            onClick={() => onChoose(option)}
                                            title={`Travel to ${option.name}`}
                                            className="group flex items-center gap-2 rounded-lg border border-sidebar-border p-2 text-left hover:bg-accent transition-colors"
                                        >
                                            <ArtistAvatar
                                                name={option.name}
                                                imageUrl={option.image ? fixWikiImageURL(option.image) : undefined}
                                                color={getArtistColor(option)}
                                                className="size-9 border-2 shrink-0"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold truncate group-hover:text-foreground">
                                                    {option.name}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground truncate">
                                                    {formatNumberCompact(option.listeners || 0)} listeners
                                                </span>
                                            </div>
                                            {isGem && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-auto shrink-0 gap-1 px-1.5 text-[10px]"
                                                    title="Far fewer listeners than your current stop"
                                                >
                                                    <Gem className="size-3 text-amber-500" />
                                                    Gem
                                                </Badge>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default JourneyPanel;
