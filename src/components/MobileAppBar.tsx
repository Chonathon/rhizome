import React from "react"
import { BookOpen, CircleHelp, Mic, MoreHorizontal, Search as SearchIcon, Tag, Telescope, CircleUserRound, Cable, Settings, HandHeart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AccountMenuState, GraphType } from "@/types"
import { toast } from "sonner"
import { AccountMenuGuestSection } from "@/components/AccountMenuGuestSection"

type MobileAppBarProps = {
  graph: GraphType
  onGraphChange: (g: GraphType) => void
  onOpenSearch: () => void
  resetAppState: () => void;
  accountMenuState?: AccountMenuState;
  onSignUpClick?: () => void;
  onLoginClick?: () => void;
}

/**
 * Floating bottom app bar for small screens.
 * Provides quick access to Search, Collection, Genres, Artists, and a More menu.
 * Styled to match the existing glassy/rounded aesthetic.
 */
export function MobileAppBar({ graph, onGraphChange, onOpenSearch,resetAppState, accountMenuState = "authorized", onSignUpClick, onLoginClick }: MobileAppBarProps) {
  return (
    <div className="pointer-events-none fixed flex justify-center gap-3 inset-x-0 bottom-3 z-50 md:hidden"
    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div
        className="pointer-events-auto rounded-full w-fit
         border border-border bg-sidebar backdrop-blur-md shadow-md items-center flex supports-[backdrop-filter]:bg-popover/60"
        
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
         border border-border bg-sidebar backdrop-blur-md shadow-md items-center flex supports-[backdrop-filter]:bg-popover/60"
        
      >
        <div className="w-fit grid grid-cols-3">
          {/* <ToolbarButton
            label="Search"
            onClick={onOpenSearch}
            icon={<SearchIcon className="size-6" />}
          /> */}
          <ToolbarButton
            label="Collection"
            onClick={() => window.dispatchEvent(new Event('auth:open'))}
            icon={<BookOpen className="size-6" />}
          />
          <ToolbarButton
            label="Explore"
            active={graph === "genres"}
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
          <MoreMenu accountMenuState={accountMenuState} onSignUpClick={onSignUpClick} onLoginClick={onLoginClick} />
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

function MoreMenu({ accountMenuState = "authorized", onSignUpClick, onLoginClick }: { accountMenuState?: AccountMenuState; onSignUpClick?: () => void; onLoginClick?: () => void }) {
  const showAccountControls = accountMenuState === "authorized"
  const handleSignUp = () => {
    if (onSignUpClick) {
      onSignUpClick()
      return
    }
    window.dispatchEvent(new Event('auth:open'))
  }
  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick()
      return
    }
    window.dispatchEvent(new Event('auth:open'))
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="xl" className="w-full rounded-full py-4 text-muted-foreground">
          <MoreHorizontal className="size-6" />
          {/* <span className="text-[10px] leading-tight">More</span> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end">
                            {showAccountControls ? (
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
                                <AccountMenuGuestSection onSignUp={handleSignUp} onLogin={handleLogin} className="w-full" />
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              window.open('https://ko-fi.com/rhizomefyi', '_blank');
                            }}><img src="src/assets/kofi_symbol.svg" alt="Ko-fi Logo" className="size-4"/>
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
