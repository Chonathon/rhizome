import React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AccountMenuGuestSectionProps = {
  onSignUp: () => void
  onLogin: () => void
  className?: string
}

export function AccountMenuGuestSection({
  onSignUp,
  onLogin,
  className,
}: AccountMenuGuestSectionProps) {
  return (
    <div className={cn("w-64 space-y-3 px-3 py-3", className)}>
      <div className="space-y-1">
        <p className="text-xl font-semibold text-foreground">Create a free account</p>
        <p className="text-md text-muted-foreground">
          Save your collection, sync listening history, and unlock upcoming features.
        </p>
      </div>
      <div className="flex gap-2">
        <DropdownMenuItem
          // asChild
          className="p-0 w-full"
          onSelect={() => {
            onSignUp()
          }}
        >
          <Button
            size="lg"
            className="flex-1"
          >
            Sign up
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem
          // asChild
          className="p-0 w-full"
          onSelect={() => {
            onLogin()
          }}
        >
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
          >
            Log in
          </Button>
        </DropdownMenuItem>
      </div>
    </div>
  )
}
