import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Compass, Check } from "lucide-react";
import { Genre } from "@/types";
import { hexToRgb } from "@/lib/colors";

interface GenreExplorationOnboardingProps {
  /** All genres available */
  genres: Genre[];
  /** IDs of root genres (top-level) */
  genreRoots: string[];
  /** Color map: genreId → hex color */
  genreColorMap: Map<string, string>;
  /** Called when user confirms their genre selection */
  onConfirm: (selectedGenreIds: string[]) => void;
  /** Called when user dismisses the onboarding */
  onDismiss: () => void;
  open: boolean;
}

const MIN_SELECTION = 1;
const MAX_SELECTION = 4;

export default function GenreExplorationOnboarding({
  genres,
  genreRoots,
  genreColorMap,
  onConfirm,
  onDismiss,
  open,
}: GenreExplorationOnboardingProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rootGenres = useMemo(() => {
    if (!genres?.length || !genreRoots?.length) return [];
    return genreRoots
      .map((id) => genres.find((g) => g.id === id))
      .filter((g): g is Genre => !!g)
      .sort((a, b) => (b.artistCount ?? 0) - (a.artistCount ?? 0))
      .slice(0, 16);
  }, [genres, genreRoots]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTION) {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size >= MIN_SELECTION) {
      onConfirm(Array.from(selected));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="genre-onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 flex flex-col gap-5"
          >
            {/* Header */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <Compass size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">Explore by Genre</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Choose up to {MAX_SELECTION} genres to start exploring — the graph will show artist territories for each.
                </p>
              </div>
            </div>

            {/* Genre grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {rootGenres.map((genre) => {
                const color = genreColorMap.get(genre.id) ?? "#8a80ff";
                const rgb = hexToRgb(color);
                const isSelected = selected.has(genre.id);
                const isDisabled = !isSelected && selected.size >= MAX_SELECTION;

                return (
                  <button
                    key={genre.id}
                    onClick={() => toggle(genre.id)}
                    disabled={isDisabled}
                    className={`
                      relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left
                      transition-all duration-150 text-sm font-medium
                      ${isSelected
                        ? "border-transparent shadow-md scale-[1.02]"
                        : isDisabled
                          ? "opacity-40 cursor-not-allowed border-border"
                          : "border-border hover:border-primary/40 hover:bg-muted"
                      }
                    `}
                    style={
                      isSelected && rgb
                        ? {
                            background: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
                            borderColor: color,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="shrink-0 w-2.5 h-2.5 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="truncate">{genre.name}</span>
                    </div>
                    {isSelected && (
                      <Check size={14} className="shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                {selected.size === 0
                  ? "Select at least one genre"
                  : `${selected.size} of ${MAX_SELECTION} selected`}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={selected.size < MIN_SELECTION}
                >
                  Start Exploring
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
