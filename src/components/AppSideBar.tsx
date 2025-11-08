import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import React, { useCallback } from "react"
import { Settings, CircleUserRound, Cable, HandHeart, SunMoon } from "lucide-react"
import { TwoLines, SearchIcon, SearchFilled, BookOpen, BookOpenFilled, Telescope, TelescopeFilled } from "./Icon"
import { Genre, GraphType } from "@/types"
import RhizomeLogo from "@/components/RhizomeLogo"
import { useSidebar } from "@/components/ui/sidebar"
import MobileAppBar from "@/components/MobileAppBar"
import { AccountMenuGuestSection } from "@/components/AccountMenuGuestSection"
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu"
import { useTheme } from "next-themes"
import KofiLogo from "@/assets/kofi_symbol.svg"

interface AppSidebarProps {
  onClick: () => void;
  onLinkedGenreClick: (genreID: string) => void;
  selectedGenre?: Genre;
  children: React.ReactNode;
  setSearchOpen: (open: boolean) => void;
  graph: GraphType;
  onGraphChange: (g: GraphType) => void;
  resetAppState: () => void;
  onCollectionClick: () => void;
  onExploreClick: () => void;
  signedInUser: boolean;
  onSignUpClick?: () => void;
  onLoginClick?: () => void;
  isCollectionMode: boolean;
  searchOpen?: boolean;
}

export function AppSidebar({ children, onClick, selectedGenre, setSearchOpen, onLinkedGenreClick, graph, onGraphChange, resetAppState, signedInUser, onSignUpClick, onLoginClick, onCollectionClick, onExploreClick, isCollectionMode, searchOpen }: AppSidebarProps) {
  const { setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()

  const handleSignUp = useCallback(() => {
    if (onSignUpClick) {
      onSignUpClick()
      return
    }
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'signup' } }))
  }, [onSignUpClick])

  const handleLogin = useCallback(() => {
    if (onLoginClick) {
      onLoginClick()
      return
    }
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }))
  }, [onLoginClick])

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarContent className="p-1 flex flex-col">
          <div className="w-full justify-center pt-2.5 pl-1 mb-6">
            <button onClick={resetAppState} className="group/logo">
              <RhizomeLogo className="h-9 w-auto mx-auto text-primary" />
            </button>
          </div>

          <SidebarContent className="flex-none">
            <SidebarGroupContent className="flex gap-4 flex-col">
              <SidebarGroup>
                <SidebarMenu className="gap-4">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Search ⌘K" isActive={searchOpen} size="xl">
                      <button onClick={() => setSearchOpen(true)}>
                        {searchOpen ? <SearchFilled className="shrink-0" /> : <SearchIcon className="shrink-0" />}
                        <span className="truncate">Search</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Collection" size="xl" isActive={isCollectionMode}>
                      <button onClick={onCollectionClick}>
                        {isCollectionMode ? <BookOpenFilled /> : <BookOpen />}
                        <span className="truncate">Collection</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarMenu className="gap-4">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={!isCollectionMode} tooltip="Explore" size="xl">
                      <button onClick={onExploreClick}>
                        {!isCollectionMode ? <TelescopeFilled /> : <Telescope />}
                        <span>Explore</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarGroupContent>
          </SidebarContent>

          <SidebarContent className="mt-6 flex-1">
            <button className="hover:bg-sidebar cursor-e-resize w-full h-full rounded-lg" onClick={toggleSidebar} />
          </SidebarContent>
        </SidebarContent>
        <SidebarFooter className="mt-auto flex p-1 pb-3">
          <SidebarMenu className="gap-4">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="xl" tooltip="More">
                    <TwoLines />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" align="end">
                {signedInUser ? (
                  <>
                    <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'Profile' } }))}>
                      <CircleUserRound />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open', { detail: { view: 'Connections' } }))}>
                      <Cable />
                      Connections
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('settings:open'))}>
                      <Settings />
                      Settings
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <AccountMenuGuestSection onSignUp={handleSignUp} onLogin={handleLogin} />
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="aria-hidden">
                      <SunMoon className="mr-2 text-muted-foreground h-4 w-4" />
                    </span>
                    Appearance
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  window.open('https://ko-fi.com/rhizomefyi', '_blank');
                }}>
                  <img src={KofiLogo} alt="Ko-fi Logo" className="size-4" />
                  Support Rhizome
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => window.dispatchEvent(new Event('feedback:open'))}>
                  <HandHeart />
                  Feedback & Requests
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>

      <MobileAppBar
        graph={graph}
        onGraphChange={onGraphChange}
        onOpenSearch={() => setSearchOpen(true)}
        resetAppState={resetAppState}
        signedInUser={signedInUser}
        onSignUpClick={handleSignUp}
        onLoginClick={handleLogin}
        onCollectionClick={onCollectionClick}
        isCollectionMode={isCollectionMode}
      />
    </>
  )
}
