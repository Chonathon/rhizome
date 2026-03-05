import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronUp, ArrowLeft, X, Plus } from "lucide-react";
import { GenreContainerDef } from "@/types";
import { hexToRgb } from "@/lib/colors";

interface GenreContainerMenuProps {
  container: GenreContainerDef | null;
  screenPosition: { x: number; y: number } | null;
  canGoBack: boolean;
  onNavigate: (genreId: string) => void;
  onBack: () => void;
  /** Expand this genre's territory by one hop of similar-artist connections */
  onExpand: (genreId: string) => void;
  onClose: () => void;
}

export default function GenreContainerMenu({
  container,
  screenPosition,
  canGoBack,
  onNavigate,
  onBack,
  onExpand,
  onClose,
}: GenreContainerMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = !!container && !!screenPosition;

  const menuStyle = (() => {
    if (!screenPosition) return {};
    const menuW = 224;
    const menuH = 300;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(screenPosition.x + 8, vw - menuW - 8);
    const top = Math.min(screenPosition.y - 8, vh - menuH - 8);
    return { left: Math.max(8, left), top: Math.max(8, top) };
  })();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, onClose]);

  if (!container) return null;

  const rgb = hexToRgb(container.color);
  const accentBg = rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)` : "rgba(138,128,255,0.12)";

  const hasSubGenres = container.subGenres.length > 0;
  const hasParent = !!container.parentGenreId;
  const { hopDepth, canExpand } = container;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          key="genre-container-menu"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[300] flex flex-col rounded-xl border border-border bg-background shadow-xl overflow-hidden"
          style={{ width: 224, ...menuStyle }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border"
            style={{ background: accentBg, borderLeftColor: container.color, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: container.color }} />
              <span className="text-sm font-semibold truncate">{container.genreName}</span>
              {hopDepth > 0 && (
                <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-background/60 text-muted-foreground border border-border">
                  +{hopDepth}
                </span>
              )}
            </div>
            <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col py-1 max-h-64 overflow-y-auto">
            {/* Expand by one hop */}
            {canExpand && (
              <button
                onClick={() => onExpand(container.genreId)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left group"
              >
                <Plus size={14} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span>
                  Show more artists
                  <span className="ml-1 text-muted-foreground">(hop {hopDepth + 1})</span>
                </span>
              </button>
            )}

            {!canExpand && hopDepth > 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No more connected artists to show.
              </p>
            )}

            {(canExpand || hopDepth > 0 || canGoBack || hasParent || hasSubGenres) && (
              <div className="my-1 border-t border-border/50" />
            )}

            {/* Back */}
            {canGoBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
              >
                <ArrowLeft size={14} className="shrink-0" />
                <span>Go back</span>
              </button>
            )}

            {/* Parent genre */}
            {hasParent && (
              <button
                onClick={() => onNavigate(container.parentGenreId!)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">
                  <span className="text-muted-foreground">Parent: </span>
                  {container.parentGenreName ?? container.parentGenreId}
                </span>
              </button>
            )}

            {/* Sub-genres */}
            {hasSubGenres && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Explore sub-genres
                  </span>
                </div>
                {container.subGenres.slice(0, 8).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onNavigate(sub.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left group"
                  >
                    <ChevronRight size={14} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
                {container.subGenres.length > 8 && (
                  <p className="px-3 py-1.5 text-xs text-muted-foreground">
                    +{container.subGenres.length - 8} more sub-genres
                  </p>
                )}
              </>
            )}

            {!canExpand && !hasSubGenres && !hasParent && !canGoBack && (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                No related genres to navigate to.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
