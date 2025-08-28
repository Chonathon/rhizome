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
import { Icon, Undo2, Plus, BadgeIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { Genre } from "@/types"
import { Badge } from "./ui/badge"

interface AppSidebarProps {
  onClick: () => void;
  onLinkedGenreClick: (genreID: string) => void;
  selectedGenre?: Genre;
  children: React.ReactNode;
  setSearchOpen: (open: boolean) => void;
}

export function AppSidebar({ children, onClick, selectedGenre, setSearchOpen, onLinkedGenreClick }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { recentSelections } = useRecentSelections()
  console.log("Recent selections in sidebar:", recentSelections);

  return (
    <>
      <Sidebar className="" variant="floating">
        <SidebarContent className="p-1 mt-2">
          
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
          ><RhizomeLogo /></Button> */}
        {selectedGenre ? (
          <>
            <SidebarHeader className="mb-2">
              <span>{selectedGenre.name}</span>
              <p
                onClick={() => setIsExpanded((prev) => !prev)}
                className={`text-sm break-words text-muted-foreground cursor-pointer hover:text-gray-400 
              ${
                  isExpanded
                    ? "text-muted-foreground"
                    : "line-clamp-3 overflow-hidden"
                }`}
              >{selectedGenre.description}</p>
              
            </SidebarHeader>
              <div className="flex flex-col gap-4">
                {selectedGenre.subgenre_of.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupLabel>Subgenre of</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {selectedGenre.subgenre_of.map((subgenreOf, index) => (
                              <SidebarMenuItem key={`subgenreOf-${index}`}>
                                <SidebarMenuButton asChild onClick={() => onLinkedGenreClick(subgenreOf.id)}>
                                  <a>
                                    <span>{subgenreOf.name}</span>
                                  </a>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {selectedGenre.subgenres.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupLabel>Subgenres</SidebarGroupLabel>
                      <SidebarMenu>
                        {selectedGenre.subgenres.map((subgenre, index) => (
                            <SidebarMenuItem key={`subgenre-${index}`}>
                              <SidebarMenuButton asChild onClick={() => onLinkedGenreClick(subgenre.id)}>
                                <a>
                                  <span>{subgenre.name}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                )}

                {selectedGenre.fusion_of.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupLabel>Fusion of</SidebarGroupLabel>
                      <SidebarMenu>
                        {selectedGenre.fusion_of.map((fusionOf, index) => (
                            <SidebarMenuItem key={`fusion-${index}`}>
                              <SidebarMenuButton asChild>
                                <a>
                                  <span>{fusionOf.name}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                )}

                {selectedGenre.fusion_genres.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupLabel>Fusion genres</SidebarGroupLabel>
                      <SidebarMenu>
                        {selectedGenre.fusion_genres.map((fusion, index) => (
                            <SidebarMenuItem key={`fusion-${index}`}>
                              <SidebarMenuButton asChild onClick={() => onLinkedGenreClick(fusion.id)}>
                                <a>
                                  <span>{fusion.name}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                )}

                {selectedGenre.influenced_by.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupLabel>Influenced by</SidebarGroupLabel>
                      <SidebarMenu>
                        {selectedGenre.influenced_by.map((influencedBy, index) => (
                            <SidebarMenuItem key={`influencedBy-${index}`}>
                              <SidebarMenuButton asChild onClick={() => onLinkedGenreClick(influencedBy.id)}>
                                <a>
                                  <span>{influencedBy.name}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                )}

                {selectedGenre.influenced_genres.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupLabel>Influenced</SidebarGroupLabel>
                      <SidebarMenu>
                        {selectedGenre.influenced_genres.map((influencedGenres, index) => (
                            <SidebarMenuItem key={`influencedGenre-${index}`}>
                              <SidebarMenuButton asChild onClick={() => onLinkedGenreClick(influencedGenres.id)}>
                                <a>
                                  <span>{influencedGenres.name}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                )}

              </div>

          </>
        ) : (
            <SidebarGroup>
              {/* <SidebarGroupLabel>Recent Selections</SidebarGroupLabel> */}
              <SidebarGroupContent>
                <div className="w-full p-3 -mt-3.5 -ml-1.5 mb-3"><button><img src={RhizomeLogo} alt="Rhizome Logo" className="h-9 w-auto mx-auto" onClick={onClick}/></button></div>
              <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild size="xl" >
                        
                        <button onClick={() => setSearchOpen(true)}>
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
                          <span>Collection</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={true} size="xl">
                        <a href="">
                          <span>Explore</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                  </SidebarMenu>
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
            </SidebarGroup>
      )}
      </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  )
}