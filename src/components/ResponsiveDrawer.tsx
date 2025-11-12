import React, { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, 
  DrawerHandle
 } from "@/components/ui/drawer";
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

type DrawerDirection = "left" | "right" | "top" | "bottom";

export interface ResponsiveDrawerProps {
  show: boolean;
  onDismiss: () => void;
  children: React.ReactNode | ((ctx: { isDesktop: boolean; isAtMaxSnap: boolean; isAtMinSnap: boolean }) => React.ReactNode);
  contentClassName?: string;
  bodyClassName?: string;
  directionDesktop?: Extract<DrawerDirection, "left" | "right">;
  snapPoints?: number[];
  clickToCycleSnap?: boolean;
  desktopQuery?: string;
  showMobileHandle?: boolean;
  handleHeightPx?: number;
  showMobileHeader?: boolean;
  showHeaderOnDesktop?: boolean;
  headerTitle?: React.ReactNode;
  headerSubtitle?: React.ReactNode;
  /**
   * Only allow dragging via the handle when content is scrolled (not at top).
   * Prevents accidental snap when scrolling. Mobile only.
   * @default true
   */
  lockDragToHandleWhenScrolled?: boolean;
  /**
   * Selector for the scroll container inside the drawer. If not found, falls back to the card container.
   * @default '[data-drawer-scroll]'
   */
  scrollContainerSelector?: string;
  /**
   * When enabled, dragging outside the drawer while at middle snap will minimize it to the
   * first (smallest) snap point, allowing the user to interact with content underneath (like
   * a graph or map) while simultaneously minimizing the drawer. Similar to Google Maps behavior.
   * Mobile only.
   * @default false
   */
  minimizeOnCanvasTouch?: boolean;
  /**
   * Called when user starts dragging outside the drawer (on the canvas/graph).
   * Useful for triggering immediate UI changes like undimming the graph.
   */
  onCanvasDragStart?: () => void;
  /**
   * A key that identifies the current content. When this changes, the drawer will
   * reset to the default middle snap position. Useful for resetting position when
   * switching between different items (e.g., different artists or genres).
   */
  contentKey?: string | number;
}

/**
 * Responsive panel that renders a side drawer on desktop and a bottom sheet on mobile.
 * Encapsulates snap-point behavior and exposes whether the mobile sheet is fully expanded.
 */
export function ResponsiveDrawer({
  show,
  onDismiss,
  children,
  contentClassName,
  bodyClassName,
  directionDesktop = "left",
  snapPoints = [0.08, 0.50, 0.9],
  clickToCycleSnap = true,
  desktopQuery = "(min-width: 768px)",
  showMobileHandle = false,
  handleHeightPx = 28,
  showMobileHeader = true,
  showHeaderOnDesktop = true,
  headerTitle,
  headerSubtitle,
  lockDragToHandleWhenScrolled = true,
  scrollContainerSelector = '[data-drawer-scroll]',
  minimizeOnCanvasTouch = false,
  onCanvasDragStart,
  contentKey,
}: ResponsiveDrawerProps) {
  const isDesktop = useMediaQuery(desktopQuery);
  const { state: sidebarState } = useSidebar();
  const [open, setOpen] = useState(false);
  // Default to middle snap point (index 1) if available, otherwise first snap point
  const defaultSnapIndex = snapPoints.length >= 2 ? 1 : 0;
  const [activeSnap, setActiveSnap] = useState<number | string | null>(snapPoints[defaultSnapIndex] ?? 0.9);
  const [isScrollAtTop, setIsScrollAtTop] = useState(true);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElRef = React.useRef<HTMLElement | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);
  const canvasDragStartRef = React.useRef<{ x: number; y: number } | null>(null);

  // keep open state in sync with `show`
  useEffect(() => {
    if (show) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [show]);

  // Ensure consistent snap height when resizing to mobile while open
  useEffect(() => {
    // Reset to the middle snap when transitioning to mobile or opening,
    // not on every render when parents pass a new snapPoints array literal.
    if (!isDesktop && open) {
      const middleSnapIndex = snapPoints.length >= 2 ? 1 : 0;
      setActiveSnap(snapPoints[middleSnapIndex] ?? 0.9);
    }
  }, [isDesktop, open]);

  // Reset to middle snap when content changes (e.g., switching between different artists/genres)
  useEffect(() => {
    if (!isDesktop && open && contentKey !== undefined) {
      const middleSnapIndex = snapPoints.length >= 2 ? 1 : 0;
      setActiveSnap(snapPoints[middleSnapIndex] ?? 0.9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, isDesktop, open]);

  // Track whether the scroll container is at the very top to gate dragging.
  React.useEffect(() => {
    if (isDesktop || !open) return;
    const card = cardRef.current;
    if (!card) return;
    let el: HTMLElement | null = null;
    try {
      el = (card.querySelector(scrollContainerSelector) as HTMLElement) ?? card;
    } catch {
      el = card;
    }
    scrollElRef.current = el;
    const handleScroll = () => {
      // Use a small tolerance to account for sub-pixel scroll values/bounce
      const atTop = (el?.scrollTop ?? 0) <= 1;
      setIsScrollAtTop((prev) => (prev !== atTop ? atTop : prev));
    };
    // Initialize
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true } as AddEventListenerOptions);
    return () => {
      el?.removeEventListener('scroll', handleScroll as any);
    };
  }, [isDesktop, open, scrollContainerSelector]);

  // Cleanup any pending close timers on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  // Map current snap value to closest index for robust comparisons
  const activeSnapIndex = useMemo(() => {
    const value = typeof activeSnap === "string" ? parseFloat(activeSnap) : activeSnap ?? 0;
    if (typeof value !== "number" || snapPoints.length === 0) return -1;
    let bestIdx = 0;
    let bestDist = Math.abs(snapPoints[0] - value);
    for (let i = 1; i < snapPoints.length; i++) {
      const d = Math.abs(snapPoints[i] - value);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [activeSnap, snapPoints]);

  const isAtMaxSnap = useMemo(() => {
    return activeSnapIndex === snapPoints.length - 1;
  }, [activeSnapIndex, snapPoints.length]);

  const isAtMinSnap = useMemo(() => {
    return activeSnapIndex === 0;
  }, [activeSnapIndex]);

  const cycleSnap = () => {
    if (isDesktop || !clickToCycleSnap) return;
    const idx = activeSnapIndex;
    const nextIdx = idx === snapPoints.length - 1 ? 0 : Math.max(0, idx + 1);
    setActiveSnap(snapPoints[nextIdx] ?? snapPoints[0]);
  };

  const minimizeToFirstSnap = () => {
    if (isDesktop || !minimizeOnCanvasTouch) return;
    setActiveSnap(snapPoints[0]);
  };

  // Detect canvas/graph drags to minimize drawer (when not already at min snap)
  useEffect(() => {
    // Early return if feature is disabled
    if (!minimizeOnCanvasTouch) return;

    // On mobile: skip if already at minimum snap (no need for listeners)
    // On desktop: always listen (no snap behavior, need to trigger undimming)
    if (!isDesktop && isAtMinSnap) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Check if the target is outside the drawer card
      const card = cardRef.current;
      if (card && !card.contains(e.target as Node)) {
        canvasDragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (canvasDragStartRef.current) {
        // Notify parent immediately (e.g., to undim the graph)
        canvasDragStartRef.current = null;
        onCanvasDragStart?.();
        // Then minimize drawer (mobile only)
        minimizeToFirstSnap();
      }
    };

    const handlePointerUp = () => {
      canvasDragStartRef.current = null;
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [minimizeOnCanvasTouch, isAtMinSnap, onCanvasDragStart, isDesktop]);

  if (!show) return null;

  const drawerKey = isDesktop ? "desktop" : "mobile";

  // Control whether we apply the desktop side offset margin. We turn it off just before closing
  // so the Vaul translate animation can fully dismiss without leaving a sliver at the sidebar gap.
  const [useDesktopOffset, setUseDesktopOffset] = useState(true);
  const desktopSideOffset: React.CSSProperties | undefined = React.useMemo(() => {
    if (!isDesktop || !useDesktopOffset) return undefined;
    if (directionDesktop === "left") {
      return { left: "calc(var(--sidebar-gap, 0px) + 8px)" } as React.CSSProperties;
    }
    return { right: "calc(var(--sidebar-gap, 0px) + 8px)" } as React.CSSProperties;
  }, [isDesktop, useDesktopOffset, directionDesktop]);

  // Prevent overlay from covering the sidebar region on desktop
  useEffect(() => {
    const root = document.documentElement;
    if (!isDesktop) {
      root.style.setProperty("--overlay-left", "0px");
      root.style.setProperty("--overlay-right", "0px");
      root.style.setProperty("--overlay-top", "0px");
      root.style.setProperty("--overlay-bottom", "0px");
      root.style.setProperty("--overlay-top", "0px");
      root.style.setProperty("--overlay-bottom", "0px");
      return;
    }
    if (directionDesktop === "left") {
      root.style.setProperty("--overlay-left", "var(--sidebar-gap)");
      root.style.setProperty("--overlay-right", "0px");
    } else {
      root.style.setProperty("--overlay-left", "0px");
      root.style.setProperty("--overlay-right", "var(--sidebar-gap)");
    }
    // Keep the overlay vertically aligned with the floating drawer on desktop
    root.style.setProperty("--overlay-top", "calc(var(--app-header-height, 52px) + 8px)");
    root.style.setProperty("--overlay-bottom", "12px");

    return () => {
      root.style.setProperty("--overlay-left", "0px");
      root.style.setProperty("--overlay-right", "0px");
      root.style.setProperty("--overlay-top", "0px");
      root.style.setProperty("--overlay-bottom", "0px");
    };
    // Keep the overlay vertically aligned with the floating drawer on desktop
    root.style.setProperty("--overlay-top", "calc(var(--app-header-height, 52px) + 8px)");
    root.style.setProperty("--overlay-bottom", "12px");

    return () => {
      root.style.setProperty("--overlay-left", "0px");
      root.style.setProperty("--overlay-right", "0px");
      root.style.setProperty("--overlay-top", "0px");
      root.style.setProperty("--overlay-bottom", "0px");
    };
  }, [isDesktop, directionDesktop, sidebarState]);

  return (
    <Drawer
      key={drawerKey}
      open={open}
      onOpenChange={(next) => {
        // Clear any pending close callbacks when state changes
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }

        if (!next) {
          if (isDesktop) {
            // Remove the desktop offset first, then close on the next frame
            setUseDesktopOffset(false);
            requestAnimationFrame(() => {
              setOpen(false);
              // Defer parent dismissal to allow animate-out to play
              closeTimerRef.current = window.setTimeout(() => {
                closeTimerRef.current = null;
                onDismiss();
              }, 80);
            });
            return;
          } else {
            setOpen(false);
            // Defer parent dismissal to allow animate-out to play
            closeTimerRef.current = window.setTimeout(() => {
              closeTimerRef.current = null;
              onDismiss();
            }, 80);
            return;
          }
        }

        // Opening
        if (isDesktop) setUseDesktopOffset(true);
        setOpen(true);
        if (!isDesktop) setActiveSnap(snapPoints[0] ?? 0.9);
      }}
      direction={isDesktop ? directionDesktop : "bottom"}
      // Reduce velocity-driven jumps between distant snap points
      snapToSequentialPoint
      // Conservative: on mobile, only the handle can drag between snaps.
      // This eliminates unintended cycles from content taps/drags.
      handleOnly={!isDesktop && lockDragToHandleWhenScrolled}
      dismissible={true}
      modal={false}
      {...(!isDesktop
        ? {
            snapPoints,
            activeSnapPoint: activeSnap,
            setActiveSnapPoint: setActiveSnap,
          }
        : {})}
    >
      <DrawerContent
        className={cn("w-full", isDesktop ? "max-w-sm" : "h-full", contentClassName)}
        style={{
          ...(desktopSideOffset as React.CSSProperties),
          ...(isDesktop
            ? ({
                // Leave space below the header and a bottom gap to keep the drawer floating
                "--drawer-top": "calc(var(--app-header-height, 52px))",
                "--drawer-bottom": "4px",
              } as React.CSSProperties)
            : {}),
        }}
      >
        <div
          className={cn(
            "relative px-3 bg-sidebar backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm h-full w-full overflow-hidden flex flex-col min-h-0",
            isDesktop ? "pl-4" : "py-3",
            bodyClassName,
          )}
          ref={cardRef}
        >
          {!isDesktop && lockDragToHandleWhenScrolled && (
            <div className="w-full flex items-center justify-center select-none">
              <DrawerHandle className="z-50 relative h-11 w-full items-center justify-center">
                <span className="pointer-events-none h-1 w-16 rounded-full bg-muted" />
              </DrawerHandle>
            </div>
          )}
          {/* Header (mobile + desktop) inside panel */}
          {((!isDesktop && showMobileHeader) || (isDesktop && showHeaderOnDesktop)) && (
            <DrawerHeader className={cn("px-1", isDesktop ? "pt-2 pb-3" : "pt-1 pb-2") }>
              <div className="flex items-start gap-1">
                {/* Cycle button only on mobile */}
                {!isDesktop && (
                  <Button
                    aria-label={isAtMaxSnap ? "Collapse" : "Expand"}
                    variant={"secondary"}
                    size={"icon"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (clickToCycleSnap) {
                        const idx = activeSnapIndex;
                        const nextIdx = idx === snapPoints.length - 1 ? 0 : Math.max(0, idx + 1);
                        setActiveSnap(snapPoints[nextIdx] ?? snapPoints[0]);
                      }
                    }}
                  >
                    {isAtMaxSnap ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </Button>
                )}
                <div className={cn("flex-1", isDesktop ? "text-left" : "text-center") }>
                  {headerTitle && (
                    <DrawerTitle className={cn("leading-tight text-base", isDesktop ? "text-2xl" : "text-xl")}>{headerTitle}</DrawerTitle>
                  )}
                  {headerSubtitle && (
                    <DrawerDescription className={cn(isDesktop ? "text-sm" : "text-xs")}>{headerSubtitle}</DrawerDescription>
                  )}
                </div>
                <DrawerClose asChild>
                  <Button
                    aria-label="Close"
                    variant="secondary"
                    size={"icon"}
                  >
                    <X />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
          )}
          {/* Optional tap target to cycle snaps (disabled when locking to handle) */}
          {!isDesktop && showMobileHandle && clickToCycleSnap && !lockDragToHandleWhenScrolled && (
            <div className="w-full flex items-center justify-center select-none">
              <button
                type="button"
                aria-label={isAtMaxSnap ? "Collapse" : "Expand"}
                className="relative mt-0 mb-2 h-7 w-full flex items-center justify-center focus:outline-none"
                style={{ height: `${handleHeightPx}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  cycleSnap();
                }}
              >
                <span className="pointer-events-none block h-1 w-16 rounded-full bg-muted" />
              </button>
            </div>
          )}
          {typeof children === "function"
            ? children({ isDesktop, isAtMaxSnap, isAtMinSnap })
            : children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ResponsiveDrawer;
