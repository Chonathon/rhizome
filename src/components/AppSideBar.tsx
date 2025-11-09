import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import React, { useCallback, useState } from "react"
import { SidebarIcon, SearchIcon, BookOpen, Cog, Telescope, CircleUserRound, Cable, HandHeart, MessageSquare, SunMoon, } from "lucide-react"
import { TwoLines } from "./Icon"
import { Button } from "./ui/button"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { Genre, GraphType } from "@/types"
import { Badge } from "./ui/badge"
import RhizomeLogo from "@/components/RhizomeLogo"
import { useSidebar } from "@/components/ui/sidebar"
import MobileAppBar from "@/components/MobileAppBar"
import { toast } from "sonner"
import { AccountMenuGuestSection } from "@/components/AccountMenuGuestSection"
import { DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent, } from "./ui/dropdown-menu"
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
}

export function AppSidebar({ children, onClick, selectedGenre, setSearchOpen, onLinkedGenreClick, graph, onGraphChange, resetAppState, signedInUser, onSignUpClick, onLoginClick, onCollectionClick, onExploreClick, isCollectionMode }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme, setTheme } = useTheme()
  const { recentSelections } = useRecentSelections()
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
  //console.log("Recent selections in sidebar:", recentSelections);

  return (
    <>
      <Sidebar className="" variant="sidebar" collapsible="icon">
        <SidebarContent className="p-1">
              {/* <SidebarGroupContent> */}
                <div className="w-full justify-center pt-2 pl-1 mb-6">
                  <button onClick={resetAppState} className="group/logo">
                    <RhizomeLogo className="h-9 w-auto mx-auto text-primary" />
                  </button>
                </div>
          <SidebarContent className="">
                {/* <div className="w-full justify-between flex p-2.5 mb-3"><button><img src={RhizomeLogo} alt="Rhizome Logo" className="h-9 w-auto mx-auto" onClick={onClick}/></button> */}
                {/* Extra buttons top-right */}
                {/* <div className="flex gap-1">
                  <SidebarMenuButton  className="h-10 w-auto" size={"xl"}asChild >
                            <button onClick={onClick} className="">
                              <Settings size={20}/>
                            </button>
                          </SidebarMenuButton>
                          <SidebarMenuButton  className="h-10 w-auto" size={"xl"}asChild>
                            <button onClick={onClick} className="">
                              <CircleHelp size={20} />
                            </button>
                          </SidebarMenuButton>
                </div> */}
              <SidebarGroupContent className="flex gap-4 flex-col">
              <SidebarGroup>
                <SidebarMenu className="gap-4">
                      <SidebarMenuItem className="">
                        <SidebarMenuButton asChild tooltip="Search ⌘K" size="xl" >
                          <button onClick={() => setSearchOpen(true)}>
                            <SearchIcon size={24}/>
                            <span className="truncate">Search</span>
                          {/* <Badge
                            className="text-xs text-muted-foreground"
                            variant=""
                            >⌘K
                            </Badge> */}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Collection" size="xl" isActive={isCollectionMode}>
                          <button onClick={onCollectionClick}>
                            <BookOpen />
                            <span className="truncate">Collection</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
              </SidebarGroup>
                <SidebarGroup>
              <SidebarMenu className="gap-4">
                  {/* <SidebarGroupLabel className="pl-3">Explore</SidebarGroupLabel> */}
                      {/* <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={graph === "genres"} size="xl">
                          <button onClick={() => onGraphChange("genres") }>
                          <Tag />
                            <span className="truncate">Genres</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={graph === "artists" || graph === "similarArtists"} size="xl">
                          <button onClick={() => onGraphChange("artists")}>
                            <MicVocal />
                            <span className="truncate">Artists</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem> */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={!isCollectionMode} tooltip="Explore" size="xl">
                        <button onClick={onExploreClick}>
                          <Telescope />
                          <span>Explore</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
    
              </SidebarGroupContent>
      {/* )} */}
          </SidebarContent>
        </SidebarContent>
                  <SidebarFooter className="mt-auto flex pb-3">
                      {/* <SidebarGroup>
                        <SidebarMenuButton  className="h-10 " size={"xl"} asChild >
                          <button onClick={onClick} className="">
                            <Settings size={20}/>
                            <span>Settings</span>
                          </button>
                        </SidebarMenuButton>
                        <SidebarMenuButton  className="h-10 " size={"xl"} asChild>
                          <button onClick={onClick} className="">
                            <CircleHelp size={20} />
                            <span>Support & Feedback</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarGroup> */}
                          <SidebarMenu className="gap-4">
                        <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton className="" size={"xl"} tooltip="More" asChild>
                            <button type="button">
                              <TwoLines />
                            </button>
                          </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="end">
                            {/* <DropdownMenuLabel>Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator /> */}
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
                              <SidebarMenuButton className="" size={"xl"} asChild>
                                <button onClick={() => toggleSidebar()}>
                                  <SidebarIcon size={20} />
                                </button>
                              </SidebarMenuButton>
                          </SidebarMenu>
                        {/* <button className="p-2.5 -mr-1 -mb-.5 hover:bg-accent rounded-full" onClick={onClick}>
                          <Settings size={20}/>
                        </button>
                        <button className="p-2.5 -mr-.5 -mb-.5 hover:bg-accent rounded-full" onClick={onClick}>
                          <CircleHelp size={20} />
                        </button> */}
                  </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
      {/* Mobile toolbar */}
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
