import React, { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type DrawerDirection = "left" | "right" | "top" | "bottom";

export interface ResponsiveDetailPanelProps {
  show: boolean;
  onDismiss: () => void;
  children: React.ReactNode | ((ctx: { isDesktop: boolean; isAtMaxSnap: boolean }) => React.ReactNode);
  contentClassName?: string;
  bodyClassName?: string;
  directionDesktop?: Extract<DrawerDirection, "left" | "right">;
  snapPoints?: number[];
  clickToCycleSnap?: boolean;
  desktopQuery?: string;
}

/**
 * Responsive panel that renders a side drawer on desktop and a bottom sheet on mobile.
 * Encapsulates snap-point behavior and exposes whether the mobile sheet is fully expanded.
 */
export function ResponsiveDetailPanel({
  show,
  onDismiss,
  children,
  contentClassName,
  bodyClassName,
  directionDesktop = "right",
  snapPoints = [0.28, 0.9],
  clickToCycleSnap = true,
  desktopQuery = "(min-width: 1200px)",
}: ResponsiveDetailPanelProps) {
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

  const onContainerClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (isDesktop || !clickToCycleSnap) return;
    const target = e.target as HTMLElement;
    const isControl = target.closest(
      'button, a, [role="button"], [data-stop-expand]'
    );
    if (isControl) return;
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
        onClick={onContainerClick}
        onClickCapture={onContainerClick}
        onPointerUp={onContainerClick as unknown as React.PointerEventHandler}
        onTouchEnd={onContainerClick as unknown as React.TouchEventHandler}
      >
        <div
          className={cn(
            "relative px-3 bg-sidebar backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm h-full w-full overflow-clip flex flex-col min-h-0",
            isDesktop ? "pl-4" : "py-3",
            bodyClassName,
          )}
        >
          {typeof children === "function"
            ? children({ isDesktop, isAtMaxSnap })
            : children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ResponsiveDetailPanel;
