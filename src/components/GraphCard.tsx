import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CircleX } from "lucide-react";
import { useMediaQuery } from "react-responsive";

export interface GraphCardProps {
  show?: boolean;
  loading?: boolean;
  error?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  contentKey?: string | number | undefined;
  className?: string;
  contentClassName?: string;
  stacked?: boolean;
  // Content slots
  thumbnail?: ReactNode;
  title?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  // Hover delay props
  enableHoverDelay?: boolean;
  previewModeActive?: boolean;
  onShow?: () => void;
}

export function GraphCard({
  show = true,
  loading = false,
  error,
  dismissible = true,
  onDismiss,
  contentKey,
  className,
  contentClassName,
  stacked = false,
  thumbnail,
  title,
  meta,
  description,
  actions,
  enableHoverDelay = false,
  previewModeActive = false,
  onShow,
}: GraphCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [actuallyShow, setActuallyShow] = useState(show && !enableHoverDelay);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    if (cardRef.current && !loading) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, [loading]);

  // Handle hover delay logic
  useEffect(() => {
    // Clear any pending timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (!show) {
      // Hide immediately
      setActuallyShow(false);
      return;
    }

    if (!enableHoverDelay || previewModeActive) {
      // Show immediately (delay disabled or preview mode active)
      setActuallyShow(true);
      onShow?.();
      return;
    }

    // First hover - delay 400ms
    showTimeoutRef.current = setTimeout(() => {
      setActuallyShow(true);
      onShow?.();
    }, 400);

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, [show, enableHoverDelay, previewModeActive, onShow]);

  if (!actuallyShow) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={cardRef}
        style={{ height: loading && cardHeight ? `${cardHeight}px` : "auto" }}
        layout
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 24, mass: 0.8 }}
        className={`
          w-102 min-h-[126px] h-auto p-3 z-60 pb-4
          bg-card backdrop-blur-xs shadow-lg rounded-3xl border border-border
         overflow-hidden
          ${loading ? "bg-stone-50/86" : ""}
          ${className ?? ""}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {dismissible && onDismiss && (isHovered || isMobile) && (
          <div className="w-full flex justify-end absolute top-0 pr-3">
            <Button
              className="hover:bg-white/0"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              aria-label="Dismiss"
            >
              <CircleX className="fill-gray-500 dark:fill-gray-900 text-white dark:text-foreground overflow-hidden size-5" size={20} />
            </Button>
          </div>
        )}

        <motion.div
          key={contentKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            layout: { duration: 0, ease: "easeOut" },
            opacity: { delay: 0.0, duration: 0.2, ease: "easeOut" },
          }}
          layout
          className={`flex items-start gap-3 ${stacked ? "flex-col" : ""} ${contentClassName ?? ""}`}
        >
          {error ? (
            <div className="w-full h-full flex justify-center p-4 min-w-0">{error}</div>
          ) : loading ? (
            <></>
          ) : (
            <>
              {thumbnail}
              <div className="flex-1 flex flex-col items-stretch gap-1 min-w-0 h-full">
                <div className="">
                  {title}
                  {meta && <div className="text-sm text-muted-foreground w-full">{meta}</div>}
                </div>
                {description && <div className="w-full flex flex-col text-sm">{description}</div>}
                {actions && <div className="w-full h-full pt-2">{actions}</div>}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GraphCard;
