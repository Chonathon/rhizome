"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value))
    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
        {...props}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
