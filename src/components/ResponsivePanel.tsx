import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ResponsivePanelProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ResponsivePanel({ trigger, children, className }: ResponsivePanelProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent side="left" align="start" className={className}>
          {children}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn("")}>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
