import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ResponsivePanelProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  side: "left" | "right" | "top" | "bottom"
  onOpenChange?: (open: boolean) => void
}

export function ResponsivePanel({ trigger, children, className, side, onOpenChange }: ResponsivePanelProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return (
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent side={side} align="start" className={className}>
          {children}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn("")}>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
