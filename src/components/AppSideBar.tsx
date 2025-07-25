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
import { Icon, Undo2, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { Genre } from "@/types"

interface AppSidebarProps {
  onClick: () => void;
  selectedGenre?: Genre;
  children: React.ReactNode;
}

export function AppSidebar({ children, onClick, selectedGenre }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { recentSelections } = useRecentSelections()

  return (
    <>
      <Sidebar className="absolute" variant="floating">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
        ><Undo2 /></Button>
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
              >{genreRelationships.description}</p>
            </SidebarHeader>
            <SidebarContent>
              <div className="flex flex-col gap-4">
                {genreRelationships.subgenreOf.map((subgenreOf, index) => (
                  <SidebarGroup>
                    <SidebarGroupLabel>Subgenre of</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu key={index}>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <a href="">
                              <span>{subgenreOf}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
                {genreRelationships.subgenres.map((subgenre, index) => (
                  <SidebarGroup>
                    <SidebarGroupLabel>subgenres</SidebarGroupLabel>
                    <SidebarMenu key={index}>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href="">
                            <span>{subgenre}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                ))}
                {genreRelationships.fusionGenres.map((fusion, index) => (
                  <SidebarGroup>
                    <SidebarGroupLabel>Fusions</SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild>
                          <a href="">
                            <span>{fusion}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                ))}
                {genreRelationships.influencedBy.map((influencedBy, index) => (
                  <SidebarGroup>
                    <SidebarGroupLabel>Influenced by</SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild>
                          <a href="">
                            <span>{influencedBy}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                ))}
                {genreRelationships.influencedGenres.map((influencedGenres, index) => (
                  <SidebarGroup>
                    <SidebarGroupLabel>Influenced</SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild>
                          <a href="">
                            <span>{influencedGenres}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                ))}
              </div>
            </SidebarContent>
          </>
        ) : (
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Recent Selections</SidebarGroupLabel>
              <SidebarGroupContent>
                {recentSelections.map((selection) => (
                  <SidebarMenu key={selection.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <a href="">
                          <span>{selection.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        )}
        <SidebarRail />
        {/* <SidebarFooter /> */}
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  )
}