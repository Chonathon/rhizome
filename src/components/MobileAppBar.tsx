import React, { useState } from "react"
import { BookOpen, Search as SearchIcon, Telescope, CircleUserRound, Cable, Settings, HandHeart, SunMoon, ChevronDown } from "lucide-react"
import { TwoLines } from "./Icon"
import { Button } from "@/components/ui/button"
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
const ButtonStyles = "w-full rounded-full py-3 max-w-[80px] text-muted-foreground"
const buttonContainerStyles = "bg-sidebar pointer-events-auto rounded-full h-full border border-accent inset-shadow-white shadow-xs backdrop-blur-[2px] flex items-center justify-center"
/**
 * Floating bottom app bar for small screens.
 * Provides quick access to Search, Collection, Genres, Artists, and a More menu.
 * Styled to match the existing glassy/rounded aesthetic.
 */
export function MobileAppBar({ graph, onGraphChange, onOpenSearch,resetAppState, signedInUser, onSignUpClick, onLoginClick, onCollectionClick, isCollectionMode }: MobileAppBarProps) {
  return (
    <div
  className="w-[calc(100%-2rem)] pointer-events-none fixed left-1/2 -translate-x-1/2 inset-x-8 bottom-3 z-50 md:hidden flex gap-3 place-items-center "
  style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
>
      
      <div
        className={`w-full ${buttonContainerStyles}`}
        
      >
        <div className="p-1 w-full grid grid-cols-3 place-items-center">
          <ToolbarButton
            label="Collection"
            onClick={onCollectionClick}
            icon={<BookOpen className="size-7" />}
            active={isCollectionMode}
          />
          <ToolbarButton
            label="Explore"
            active={!isCollectionMode}
            onClick={resetAppState}
            icon={<Telescope className="size-7" />}
          />
          <MoreMenu signedInUser={signedInUser} onSignUpClick={onSignUpClick} onLoginClick={onLoginClick} />
        </div>
      </div>
      {/* Search */}
      <div
        className={`${buttonContainerStyles} shrink-0`}
        
      >
        <div className=" p-1 w-fit grid grid-cols-1 h-auto place-items-center">
          <ToolbarButton
            label="Search"
            onClick={onOpenSearch}
            icon={<SearchIcon className="size-7 " />}
          />
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
      className={cn(
        ButtonStyles,
        active ? "text-foreground font-semibold" : "text-muted-foreground"
      )}
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
        <Button variant="ghost" size="xl" className={ButtonStyles}>
          <TwoLines className="size-7" />
          {/* <span className="text-[10px] leading-tight">More</span> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end">
        {signedInUser ? (
          <>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'Profile' } }))}><CircleUserRound />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'Connections' } }))}><Cable />
              Connections
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open'))}><Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
