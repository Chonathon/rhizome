import { motion } from "framer-motion";
import { Loader2, RotateCcw, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpeditionHUDProps {
  seedName: string;
  artistCount: number;
  expansionCount: number;
  expanding: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onExit: () => void;
  isMobile?: boolean;
}

// Top-bar banner for expedition mode — exit badge, live counts, undo/reset.
// Rendered in the same AnimatePresence slot as the similar-artists banner.
export default function ExpeditionHUD({
  seedName,
  artistCount,
  expansionCount,
  expanding,
  canUndo,
  onUndo,
  onReset,
  onExit,
  isMobile = false,
}: ExpeditionHUDProps) {
  return (
    <motion.div
      key="expedition-hud"
      layout
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: "hidden" }}
      className="flex items-center gap-2"
    >
      <Button size="lg" variant="outline" onClick={onExit} className="gap-2">
        Expedition: {seedName}
        <X className="h-4 w-4" />
      </Button>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {artistCount} artists · {expansionCount} expanded
      </span>
      {expanding && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Expanding" />}
      {!isMobile && (
        <>
          <Button
            size="icon"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo || expanding}
            aria-label="Undo last expansion"
            title="Undo last expansion"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onReset}
            disabled={expanding}
            aria-label="Reset expedition"
            title="Back to the starting neighborhood"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </>
      )}
    </motion.div>
  );
}
