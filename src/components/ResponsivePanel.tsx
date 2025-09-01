import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerHeader, DrawerContent, DrawerTrigger, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ResponsivePanelProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  side: "left" | "right" | "top" | "bottom"
  headerTitle?: React.ReactNode
}

export function ResponsivePanel({ 
  trigger, 
  children, 
  className, 
  side, 
  headerTitle }: ResponsivePanelProps) 
{
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent side={side} align="start" className={className}>
          {children}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      
      <DrawerContent className={cn("px-3 bg-popover backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm")}>
        <div>
          <div className="bg-stone-300 mx-auto my-3 hidden h-1 w-[64px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        </div>
      {/* <DrawerHeader className={cn("px-1", isDesktop ? "pt-2 pb-3" : "pt-1 pb-2") }>
              <div className="flex items-start gap-1">
                
                <div className={cn("flex-1", isDesktop ? "text-left" : "text-center") }>
                  {headerTitle && (
                    <DrawerTitle className={cn("leading-tight text-base", isDesktop ? "text-2xl" : "text-xl")}>{headerTitle}</DrawerTitle>
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
            </DrawerHeader> */}
        {children}
      </DrawerContent>
    </Drawer>
  )
}
