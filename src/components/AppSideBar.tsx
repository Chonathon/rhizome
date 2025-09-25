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
import { Search } from "@/components/Search"
import React from "react"
import { Icon, Undo2, Plus, BadgeIcon, SidebarIcon, SearchIcon, BookOpen, Tag, MicVocal, Settings, CircleHelp } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { Genre, GraphType } from "@/types"
import { Badge } from "./ui/badge"
import RhizomeLogo from "@/components/RhizomeLogo"
import { useSidebar } from "@/components/ui/sidebar"
import MobileAppBar from "@/components/MobileAppBar"
import { toast } from "sonner"

interface AppSidebarProps {
  onClick: () => void;
  onLinkedGenreClick: (genreID: string) => void;
  selectedGenre?: Genre;
  children: React.ReactNode;
  setSearchOpen: (open: boolean) => void;
  graph: GraphType;
  onGraphChange: (g: GraphType) => void;
}

export function AppSidebar({ children, onClick, selectedGenre, setSearchOpen, onLinkedGenreClick, graph, onGraphChange }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { recentSelections } = useRecentSelections()
  const { toggleSidebar } = useSidebar()
  //console.log("Recent selections in sidebar:", recentSelections);

  return (
    <>
      <Sidebar className="" variant="sidebar" collapsible="icon">
        <SidebarContent className="p-1">
              {/* <SidebarGroupContent> */}
                <div className="w-full  justify-center p-2 mb-6">
                  <button onClick={}} className="group/logo">
                    <RhizomeLogo className="h-10 w-auto mx-auto text-primary" />
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
                        <SidebarMenuButton asChild variant="" size="xl" >
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
                        <SidebarMenuButton asChild variant="" size="xl">
                          <button onClick={() => toast("Collections are coming soon ✨")}>
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
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild variant="" isActive={graph === "genres"} size="xl">
                          <button onClick={() => onGraphChange("genres") }>
                          <Tag />
                            <span className="truncate">Genres</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild variant="" isActive={graph === "artists" || graph === "similarArtists"} size="xl">
                          <button onClick={() => onGraphChange("artists")}>
                            <MicVocal />
                            <span className="truncate">Artists</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    
                  </SidebarMenu>
                </SidebarGroup>
      {/* {selectedGenre && ( */}
                {/* {recentSelections.map((selection) => (
                  <SidebarMenu key={selection.id}>
                  <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                  <a href="">
                  <span>{selection.name}</span>
                  </a>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                  </SidebarMenu>
                  ))} */}
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
                        <SidebarMenuButton variant="" className="" size={"xl"} asChild>
                          <button onClick={() => toast("Opening feedback dialogue...")} className="">
                            <CircleHelp size={20} />
                            {/* <span>Support & Feedback</span> */}
                          </button>
                        </SidebarMenuButton>
                        <SidebarMenuButton variant="" className="" size={"xl"} asChild>
                          <button onClick={() => toggleSidebar()}>
                            <SidebarIcon size={20} />
                            {/* <span>Support & Feedback</span> */}
                          </button>
                        </SidebarMenuButton>
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
      />
    </>
  )
}
