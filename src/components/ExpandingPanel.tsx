import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronsUp } from "lucide-react";
import { CircleX } from "lucide-react"

interface ExpandingPanelProps {
  /** Button or element that toggles the panel */
  trigger?: React.ReactNode;
  /** Content shown when the panel is collapsed (summary view). If omitted, nothing is shown. */
  summary?: React.ReactNode;
  /** Content shown when the panel is expanded (detailed view). */
  children?: React.ReactNode;
  /** CSS length for the sidebar width, e.g. '16rem' or '280px' */
  sidebarWidth?: string;
  /** Padding (in px) applied on desktop when expanded */
  desktopPadding?: number;
  /** Optional controlled callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Optional callback for dismiss/close button */
  handleDismiss?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function ExpandingPanel({
  trigger,
  summary,
  children,
  sidebarWidth = "0",
  desktopPadding = 16,
  onOpenChange,
  defaultExpanded = false,
  handleDismiss,
}: ExpandingPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const setOpen = (next: boolean) => {
    setExpanded(next);
    onOpenChange?.(next);
  };

  // Render expanded panel in a portal to avoid transform/contain/overflow contexts
  return expanded
    ? createPortal(
        <div
          className="fixed inset-y-0 right-0 z-50"
          // Use left instead of width calc to avoid layout bugs; the container fills the remaining width
          style={{ left: sidebarWidth, padding: desktopPadding }}
          role="region"
        //   aria-label="Expanding panel"
          aria-expanded={true}
        >
          <Card className="h-full w-full bg-background backdrop-blur-3xl transition-all duration-300 ease-out">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-pressed={true}
              aria-label="Collapse panel"
              className="z-20  absolute top-2 right-13"
            >
              {trigger}
              <ChevronsUp className="transition-transform rotate-180" />
              <span className="sr-only">Toggle Panel</span>
            </Button>
            <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-pressed={false}
            aria-label="Dismiss Panel"
            className="z-20 absolute top-2 right-2"
          >
            <CircleX className="transition-transform rotate-0" />
            <span className="sr-only">Close Panel</span>
          </Button>
            <CardContent className="h-full overflow-auto pt-12">
              {children}
            </CardContent>
          </Card>
        </div>,
        document.body
      )
    : (
        <Card className="transition-all duration-300 ease-out" role="region" aria-label="Expanding panel" aria-expanded={false}>
          
          
            <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-pressed={false}
            aria-label="Expand panel"
            className="z-20 absolute top-2 right-13"
          >
            {trigger}
            <ChevronsUp className="transition-transform rotate-0" />
            <span className="sr-only">Toggle Panel</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-pressed={false}
            aria-label="Dismiss Panel"
            className="z-20 absolute top-2 right-2"
          >
            <CircleX className="transition-transform rotate-0" />
            <span className="sr-only">Close Panel</span>
          </Button>
          <CardContent>
            {summary}
          </CardContent>
        </Card>
      );
}
