import React, { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type DrawerDirection = "left" | "right" | "top" | "bottom";

export interface ResponsiveDrawerProps {
  show: boolean;
  onDismiss: () => void;
  children: React.ReactNode | ((ctx: { isDesktop: boolean; isAtMaxSnap: boolean }) => React.ReactNode);
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
  directionDesktop = "right",
  snapPoints = [0.28, 0.9],
  clickToCycleSnap = true,
  desktopQuery = "(min-width: 1200px)",
  showMobileHandle = false,
  handleHeightPx = 28,
  showMobileHeader = true,
  showHeaderOnDesktop = true,
  headerTitle,
  headerSubtitle,
}: ResponsiveDrawerProps) {
  const isDesktop = useMediaQuery(desktopQuery);
  const [open, setOpen] = useState(false);
  const [activeSnap, setActiveSnap] = useState<number | string | null>(snapPoints[0] ?? 0.9);

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
    if (!isDesktop && open) {
      setActiveSnap(snapPoints[0] ?? 0.9);
    }
  }, [isDesktop, open, snapPoints]);

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
    if (isDesktop) return true;
    return activeSnapIndex === snapPoints.length - 1;
  }, [activeSnapIndex, isDesktop, snapPoints.length]);

  const cycleSnap = () => {
    if (isDesktop || !clickToCycleSnap) return;
    const idx = activeSnapIndex;
    const nextIdx = idx === snapPoints.length - 1 ? 0 : Math.max(0, idx + 1);
    setActiveSnap(snapPoints[nextIdx] ?? snapPoints[0]);
  };

  if (!show) return null;

  const drawerKey = isDesktop ? "desktop" : "mobile";

  return (
    <Drawer
      key={drawerKey}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onDismiss();
        if (next && !isDesktop) setActiveSnap(snapPoints[0] ?? 0.9);
      }}
      direction={isDesktop ? directionDesktop : "bottom"}
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
        className={cn("w-full h-full", isDesktop ? "max-w-sm px-2" : "", contentClassName)}
      >
        <div
          className={cn(
            "relative px-3 bg-sidebar backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm h-full w-full overflow-clip flex flex-col min-h-0",
            isDesktop ? "pl-4" : "py-3",
            bodyClassName,
          )}
        >
          {/* Header (mobile + desktop) inside panel */}
          {((!isDesktop && showMobileHeader) || (isDesktop && showHeaderOnDesktop)) && (
            <DrawerHeader className={cn("px-1", isDesktop ? "pt-2 pb-3" : "pt-1 pb-2") }>
              <div className="flex items-start gap-1">
                {/* Cycle button only on mobile */}
                {!isDesktop && (
                  <button
                    type="button"
                    aria-label={isAtMaxSnap ? "Collapse" : "Expand"}
                    className="h-8 w-8 mt-0.5 inline-flex items-center justify-center rounded-full hover:bg-accent text-foreground"
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
                  </button>
                )}
                <div className={cn("flex-1", isDesktop ? "text-left" : "text-center") }>
                  {headerTitle && (
                    <DrawerTitle className={cn("leading-tight", isDesktop ? "text-2xl lg:text-3xl" : "text-base")}>{headerTitle}</DrawerTitle>
                  )}
                  {headerSubtitle && (
                    <DrawerDescription className={cn(isDesktop ? "text-sm" : "text-xs")}>{headerSubtitle}</DrawerDescription>
                  )}
                </div>
                <DrawerClose asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="h-8 w-8 mt-0.5 inline-flex items-center justify-center rounded-full hover:bg-accent text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DrawerClose>
              </div>
            </DrawerHeader>
          )}
          {/* Mobile handle area: conventional tap target to cycle snaps */}
          {!isDesktop && showMobileHandle && clickToCycleSnap && (
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
            ? children({ isDesktop, isAtMaxSnap })
            : children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ResponsiveDrawer;
