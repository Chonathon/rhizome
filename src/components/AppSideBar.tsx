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
import { Settings, CircleUserRound, Cable, HandHeart, SunMoon, ArrowLeftToLine, Cog, ArrowUpRight } from "lucide-react"
import { TwoLines, SearchIcon, SearchFilled, BookOpen, BookOpenFilled, Telescope, TelescopeFilled } from "./Icon"
import { Artist, Genre, GraphType } from "@/types"
import { RecentsPopover } from "@/components/RecentsPopover"
import { RecentSelectionItem } from "@/hooks/useRecentSelections"
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
import { AnimatePresence, motion } from "framer-motion"
import { PHASE_VERSION } from "@/constants"

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
  onRecentsSelect: (item: RecentSelectionItem) => void;
  getArtistImageByName?: (name: string) => string | undefined;
  getArtistByName?: (name: string) => Artist | undefined;
  getArtistColor?: (artist: Artist) => string;
  genreColorMap?: Map<string, string>;
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
  playerPreviewMode?: boolean;
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
  onRecentsSelect,
  getArtistImageByName,
  getArtistByName,
  getArtistColor,
  genreColorMap,
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
  playerStartIndex,
  playerPreviewMode
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
  // Extract phase and version from PHASE_VERSION (format: "valpha-0.2.0")
  const [rawPhase, rawVersion] = PHASE_VERSION.split('-');
  const cleanPhase = rawPhase?.replace(/^v/, '').charAt(0).toUpperCase() + rawPhase?.replace(/^v/, '').slice(1) || 'Alpha';

  function AlphaBadge() {
  return (
      <a href="https://www.notion.so/seanathon/Rhizome-Changelog-2cd7b160b42a8090ace6d43d3803b2ae?source=copy_link" className={`shrink-0 font-medium flex items-center text-center text-muted-foreground/70 dark:bg-accent/50 bg-muted/50 hover:bg-muted rounded hover:dark:bg-accent tracking-wide text-xs px-1.5 py-0.5`} target="_blank" rel="noopener noreferrer">
      <div >
        {cleanPhase} v{rawVersion}
      <ArrowUpRight className="size-3 inline-block " />
    </div>
      </a>
  );
}

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarContent className={`${isCollapsed ? "" : "backdrop-blur-[2px]"} p-1 flex flex-col`}>
          <div className={`${isCollapsed ? "" : " items-center justify-start" } flex w-full pt-2.5 pl-1 mb-6`}>
            <button onClick={resetAppState} className="group/logo" title="Reset App">
              <RhizomeLogo className="h-9 w-auto mx-auto text-primary" />
            </button>
            {/* {!isCollapsed && <SidebarMenuButton asChild tooltip={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} size="xl"
            className="w-auto">
              <button onClick={toggleSidebar} className="">
                <ArrowLeftToLine />
              </button>
            </SidebarMenuButton>} */}
            {/* <div className={`pl-2 ${isCollapsed ? "hidden" : "block"}`}>
              <AlphaBadge  />
            </div> */}
          </div>

          <SidebarContent className={!isCollapsed ? "flex-1 min-h-0" : "flex-none"}>
            <SidebarGroupContent className={`flex gap-4 flex-col${!isCollapsed ? " flex-1 min-h-0" : ""}`}>
              <SidebarGroup className={!isCollapsed ? "flex-1 min-h-0" : ""}>
                <SidebarMenu className={`gap-4${!isCollapsed ? " flex-1 min-h-0" : ""}`}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Search ⌘K" size="xl" >
                      <button onClick={() => setSearchOpen(true)}>
                        <SearchIcon className="shrink-0" />
                        <span className="truncate">Search</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={!isCollectionMode} tooltip="Explore" size="xl">
                      <button onClick={onExploreClick}>
                        <Telescope />
                        {/* {!isCollectionMode ? <TelescopeFilled /> : <Telescope />} */}
                        <span>Explore</span>
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

                  <SidebarMenuItem className={!isCollapsed ? "flex-1 min-h-0 overflow-hidden" : ""}>
                    <RecentsPopover
                      onItemSelect={onRecentsSelect}
                      isCollapsed={isCollapsed}
                      onSearchOpen={() => setSearchOpen(true)}
                      getArtistImageByName={getArtistImageByName}
                      getArtistByName={getArtistByName}
                      getArtistColor={getArtistColor}
                      genreColorMap={genreColorMap}
                    />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarGroup>
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
              className="w-full h-full rounded-md !cursor-e-resize hover:bg-sidebar-accent dark:hover:bg-sidebar-accent/40"
            />
          </SidebarContent>}
        </SidebarContent>

        {/* Portal slot for desktop player UI - SidebarPlayer renders into this */}
        <div id="sidebar-player-slot" ref={desktopPlayerSlotRef} />

        <SidebarFooter className="mt-auto flex p-1 pb-3">
          <SidebarMenu className={isCollapsed ? "mx-auto" : "flex w-full flex-row justify-between items-center"}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="xl" className="self-start w-auto" tooltip="More">
                    <TwoLines />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" align="end" className="z-[70]">
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
                              <DropdownMenuSubContent className="z-[70]">
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
            <AnimatePresence mode="popLayout">
              {!isCollapsed && <motion.div 
              key={"alpha-badge"}
              initial={{ opacity: 0, display: "none" }}
              animate={{ opacity: 1, display: "block" }}
              transition={{ delay: 0.1, duration: 0.2 }}
              exit={{ opacity: 0, transition: { delay: 0} }}
              className={`
              
              `}>
                <AlphaBadge  />
              </motion.div>}
            </AnimatePresence>
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
        previewMode={playerPreviewMode}
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
