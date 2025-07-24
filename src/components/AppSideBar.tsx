import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
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
import { Plus } from "lucide-react"

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const genreRelationships = {
    subgenreOf: ["metal"],
    subgenres: ["technical thrash metal"],
    fusionGenres: ["crossover thrash"],
    influencedBy: ["hardcore punk", "nwobhm", "speed metal"],
    influencedGenres: ["groove metal", "stenchcore"],
    otherDatabases: {
      rateYourMusic: "https://rateyourmusic.com/genre/thrash-metal",
      wikidata: "Q483352",
    }
  }

  return (
    <>
      <Sidebar className="absolute" variant="floating">
        <SidebarHeader />
        <SidebarContent>
          <SidebarGroupLabel>Subgenre of</SidebarGroupLabel>
         
          {/* <SidebarGroupAction>
            <Plus /> <span className="sr-only">Add Project</span>
          </SidebarGroupAction> */}

        <SidebarMenu>
          
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="">
                  <span>{genreRelationships.subgenreOf}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="">
                  <span>{genreRelationships.subgenreOf}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

          <SidebarGroup />
          
          <SidebarGroupLabel>subgenres</SidebarGroupLabel>
        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="">
                  <span>{genreRelationships.subgenres}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
          <SidebarGroupLabel>Fusions</SidebarGroupLabel>
        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="">
                  <span>{genreRelationships.fusionGenres}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

          <SidebarGroup />
        </SidebarContent>
         <SidebarRail />
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  )
}