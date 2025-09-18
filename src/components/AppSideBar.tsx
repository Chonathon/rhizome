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
import { Icon, Undo2, Plus, BadgeIcon, SidebarIcon, SearchIcon, BookOpen, Tag, Mic } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { Genre, GraphType } from "@/types"
import { Badge } from "./ui/badge"
import RhizomeLogo from "@/components/RhizomeLogo"

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
  //console.log("Recent selections in sidebar:", recentSelections);

  return (
    <>
      <Sidebar className="" variant="floating">
        <SidebarContent className="p-1 mt-2">
              <SidebarGroupContent>
                <div className="w-full p-3 -mt-3.5 -ml-1.5 mb-3">
                  <button onClick={onClick} className="group/logo">
                    <RhizomeLogo className="h-9 w-auto mx-auto text-primary" />
                  </button>
                </div>
              <SidebarGroup>
                <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild size="xl" >
                          <button onClick={() => setSearchOpen(true)}>
                            <SearchIcon size={24}/>
                            <span>Search</span>
                          <Badge
                            className="text-xs text-muted-foreground"
                            variant="outline"
                            >⌘K
                            </Badge>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild size="xl">
                          <a href="">
                            <BookOpen />
                            <span>Collection</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
              </SidebarGroup>
                <SidebarGroup>
              <SidebarMenu>
                  <SidebarGroupLabel className="pl-3">Explore</SidebarGroupLabel>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={graph === "genres"} size="xl">
                          <button onClick={() => onGraphChange("genres") }>
                          <Tag />
                            <span>Genres</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={graph === "artists" || graph === "similarArtists"} size="xl">
                          <button onClick={() => onGraphChange("artists")}>
                            <Mic />
                            <span>Artists</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    
                  </SidebarMenu>
                </SidebarGroup>
                
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
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  )
}
