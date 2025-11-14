import React, { useState } from "react"
import {  CircleUserRound, Cable, Settings, HandHeart, SunMoon, ChevronDown, Cog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Search as SearchIcon, BookOpen, Telescope, TwoLines } from "./Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GraphType } from "@/types"
import { AccountMenuGuestSection } from "@/components/AccountMenuGuestSection"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import KofiLogo from "@/assets/kofi_symbol.svg"

type MobileAppBarProps = {
  graph: GraphType
  onGraphChange: (g: GraphType) => void
  onOpenSearch: () => void
  resetAppState: () => void;
  signedInUser: boolean;
  onSignUpClick?: () => void;
  onLoginClick?: () => void;
  onCollectionClick: () => void;
  isCollectionMode: boolean;
}

/**
 * Floating bottom app bar for small screens.
 * Provides quick access to Search, Collection, Genres, Artists, and a More menu.
 * Styled to match the existing glassy/rounded aesthetic.
 */
export function MobileAppBar({ graph, onGraphChange, onOpenSearch,resetAppState, signedInUser, onSignUpClick, onLoginClick, onCollectionClick, isCollectionMode }: MobileAppBarProps) {
  return (
    <div className="pointer-events-none fixed flex justify-center gap-3 inset-x-0 bottom-3 z-50 md:hidden"
    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div
        className="pointer-events-auto rounded-full w-fit
         border border-border  backdrop-blur-md shadow-md items-center flex "
        
      >
        <div className="w-fit grid grid-cols-1">
          <ToolbarButton
            label="Search"
            onClick={onOpenSearch}
            icon={<SearchIcon className="size-6" />}
          />
        </div>
      </div>
      <div
        className="pointer-events-auto rounded-full w-fit
         border border-border backdrop-blur-md shadow-md items-center flex supports-[backdrop-filter]:bg-popover/60"
        
      >
        <div className="w-fit grid grid-cols-3">
          {/* <ToolbarButton
            label="Search"
            onClick={onOpenSearch}
            icon={<SearchIcon className="size-6" />}
          /> */}
          <ToolbarButton
            label="Collection"
            onClick={onCollectionClick}
            icon={<BookOpen className="size-6" />}
            active={isCollectionMode}
          />
          <ToolbarButton
            label="Explore"
            active={!isCollectionMode}
            onClick={resetAppState}
            icon={<Telescope className="size-6" />}
          />
          {/* <ToolbarButton
            label="Genres"
            active={graph === "genres"}
            onClick={() => onGraphChange("genres")}
            icon={<Tag className="size-6" />}
          /> */}
          {/* <ToolbarButton
            label="Artists"
            active={graph === "artists" || graph === "similarArtists"}
            onClick={() => onGraphChange("artists")}
            icon={<Mic className="size-6" />}
          /> */}
          <MoreMenu signedInUser={signedInUser} onSignUpClick={onSignUpClick} onLoginClick={onLoginClick} />
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="xl"
      onClick={onClick}
      className={`font-regular max-w-[56px] rounded-full ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}
    >
      {icon}
      {/* <span className="text-[10px] leading-tight">{label}</span> */}
    </Button>
  )
}

function MoreMenu({ signedInUser, onSignUpClick, onLoginClick }: { signedInUser: boolean; onSignUpClick?: () => void; onLoginClick?: () => void }) {
  const { setTheme } = useTheme()
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false)
  const handleSignUp = () => {
    if (onSignUpClick) {
      onSignUpClick()
      return
    }
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'signup' } }))
  }
  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick()
      return
    }
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }))
  }
  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => {
        if (!open) {
          setIsAppearanceOpen(false)
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="xl" className="w-full rounded-full py-4 text-muted-foreground">
          <TwoLines className="size-6" />
          {/* <span className="text-[10px] leading-tight">More</span> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end">
        {signedInUser ? (
          <>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'General' } }))}><Cog />
              General
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'Account' } }))}><CircleUserRound />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'Connections' } }))}><Cable />
              Connections
            </DropdownMenuItem>
        </>
        ) : (
          <>
            <AccountMenuGuestSection onSignUp={handleSignUp} onLogin={handleLogin} className="" />
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            setIsAppearanceOpen((prev) => !prev)
          }}
          aria-expanded={isAppearanceOpen}
          className="flex items-center justify-between gap-2 transition-all"
        >
          <span className="flex items-center gap-2">
            <SunMoon className="h-4 w-4 text-muted-foreground" />
            Appearance
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isAppearanceOpen ? "rotate-180" : ""}`} />
        </DropdownMenuItem>
        <div
          role="group"
          aria-label="Appearance options"
          className={cn(
            "grid gap-1 overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
            isAppearanceOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <DropdownMenuItem
              className={cn(
                "pl-8 transition-opacity duration-200 ease-out",
                isAppearanceOpen ? "opacity-100" : "pointer-events-none opacity-0"
              )}
              onClick={() => setTheme("system")}
            >
              System
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(
                "pl-8 transition-opacity duration-200 ease-out",
                isAppearanceOpen ? "opacity-100" : "pointer-events-none opacity-0"
              )}
              onClick={() => setTheme("dark")}
            >
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(
                "pl-8 transition-opacity duration-200 ease-out",
                isAppearanceOpen ? "opacity-100" : "pointer-events-none opacity-0"
              )}
              onClick={() => setTheme("light")}
            >
              Light
            </DropdownMenuItem>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => {
          e.preventDefault();
          window.open('https://ko-fi.com/rhizomefyi', '_blank');
        }}><img src={KofiLogo} alt="Ko-fi Logo" className="size-4"/>
          Support Rhizome
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.dispatchEvent(new Event('feedback:open'))}><HandHeart />
          Feedback & Requests
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileAppBar
