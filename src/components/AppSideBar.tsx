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
import React, { useCallback, useRef } from "react"
import { Settings, CircleUserRound, Cable, HandHeart, SunMoon, ArrowLeftToLine, Cog } from "lucide-react"
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
import SidebarPlayer from "@/components/SidebarPlayer"
import { useMediaQuery } from "@/hooks/use-media-query"

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
  // Player props
  playerOpen: boolean;
  onPlayerOpenChange: (open: boolean) => void;
  playerVideoIds: string[];
  playerTitle?: string;
  playerArtworkUrl?: string;
  playerLoading?: boolean;
  onPlayerLoadingChange?: (loading: boolean) => void;
  playerHeaderPreferProvidedTitle?: boolean;
  onPlayerTitleClick?: () => void;
  playerStartIndex?: number;
}

export function AppSidebar({
  children,
  onClick,
  selectedGenre,
  setSearchOpen,
  onLinkedGenreClick,
  graph,
  onGraphChange,
  resetAppState,
  signedInUser,
  onSignUpClick,
  onLoginClick,
  onCollectionClick,
  onExploreClick,
  isCollectionMode,
  searchOpen,
  playerOpen,
  onPlayerOpenChange,
  playerVideoIds,
  playerTitle,
  playerArtworkUrl,
  playerLoading,
  onPlayerLoadingChange,
  playerHeaderPreferProvidedTitle,
  onPlayerTitleClick,
  playerStartIndex
}: AppSidebarProps) {
  const { setTheme } = useTheme()
  const { toggleSidebar, state } = useSidebar()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const desktopPlayerSlotRef = useRef<HTMLDivElement>(null)

  const isCollapsed = state === "collapsed"

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
        <SidebarContent className={`${isCollapsed ? "" : "backdrop-blur-[2px]"} p-1 flex flex-col`}>
          <div className={`${isCollapsed ? "" : " items-center justify-between" } flex w-full pt-2.5 pl-1 mb-6`}>
            <button onClick={resetAppState} className="group/logo">
              <RhizomeLogo className="h-9 w-auto mx-auto text-primary" />
            </button>
            {/* {!isCollapsed && <SidebarMenuButton asChild tooltip={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} size="xl"
            className="w-auto">
              <button onClick={toggleSidebar} className="">
                <ArrowLeftToLine />
              </button>
            </SidebarMenuButton>} */}
          </div>

          <SidebarContent className="flex-none">
            <SidebarGroupContent className="flex gap-4 flex-col">
              <SidebarGroup>
                <SidebarMenu className="gap-4">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Search ⌘K" size="xl" >
                      <button onClick={() => setSearchOpen(true)}>
                        <SearchIcon className="shrink-0" />
                        <span className="truncate">Search</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Collection" size="xl" isActive={isCollectionMode}>
                      <button onClick={onCollectionClick}>
                        <BookOpen />
                        {/* {isCollectionMode ? <BookOpenFilled /> : <BookOpen />} */}
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
                        <Telescope />
                        {/* {!isCollectionMode ? <TelescopeFilled /> : <Telescope />} */}
                        <span>Explore</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarGroupContent>
          </SidebarContent>
          {/* 
          * Toggle Button when collapsed
          * Fills remaining space between content and footer
          */}
          {isCollapsed && <SidebarContent className="my-3 flex-1">
            <button
              type="button"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleSidebar}
              className="w-full h-full rounded-md !cursor-e-resize hover:bg-sidebar/30"
            />
          </SidebarContent>}
        </SidebarContent>

        {/* Portal slot for desktop player UI - SidebarPlayer renders into this */}
        <div id="sidebar-player-slot" ref={desktopPlayerSlotRef} />

        <SidebarFooter className="mt-auto flex p-1 pb-3">
          <SidebarMenu className={isCollapsed ? "mx-auto gap-4" : "flex w-full flex-row justify-between gap-4"}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="xl" className="self-start w-auto" tooltip="More">
                    <TwoLines />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" align="end">
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
                                <AccountMenuGuestSection onSignUp={handleSignUp} onLogin={handleLogin} />
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuSub>
                            <DropdownMenuSubTrigger><span className="aria-hidden">
                              <SunMoon className="mr-2 text-muted-foreground h-4 w-4" />
                            </span>  Appearance</DropdownMenuSubTrigger>
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
                            }}><img src={KofiLogo} alt="Ko-fi Logo" className="size-4"/>
                              Support Rhizome
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.dispatchEvent(new Event('feedback:open'))}><HandHeart />
                              Feedback & Requests
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
            {!isCollapsed && <SidebarMenuButton asChild tooltip="Collapse sidebar" size="xl"
            className="w-auto">
              <button className="!cursor-w-resize" onClick={toggleSidebar}>
                <ArrowLeftToLine />
              </button>
            </SidebarMenuButton>}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Player - single stable instance outside Sidebar to avoid containing block issues */}
      <SidebarPlayer
        open={playerOpen}
        onOpenChange={onPlayerOpenChange}
        videoIds={playerVideoIds}
        title={playerTitle}
        autoplay
        artworkUrl={playerArtworkUrl}
        loading={playerLoading}
        onLoadingChange={onPlayerLoadingChange}
        headerPreferProvidedTitle={playerHeaderPreferProvidedTitle}
        onTitleClick={onPlayerTitleClick}
        startIndex={playerStartIndex}
        sidebarCollapsed={isCollapsed}
        isDesktop={isDesktop}
        desktopSlotRef={desktopPlayerSlotRef}
      />

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
