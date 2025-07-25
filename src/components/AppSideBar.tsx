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

interface AppSidebarProps {
  onClick: () => void;
}
export function AppSidebar({ children, onClick }: { children: React.ReactNode }) {
  
  const [isExpanded, setIsExpanded] = useState(false)
  const genreRelationships = {
    description: `The genre emerged in the early 1980s as musicians began fusing the double bass drumming and complex guitar stylings of the new wave of British heavy metal (NWOBHM) with the speed and aggression of hardcore punk and the technicality of progressive rock. Philosophically, thrash metal developed as a backlash against both the conservatism of the Reagan era and the much more moderate, pop-influenced, and widely accessible heavy metal subgenre of glam metal which also developed concurrently in the 1980s. Derived genres include crossover thrash, a fusion of thrash metal and hardcore punk.
    
    The early thrash metal movement revolved around independent record labels, including Megaforce, Metal Blade, Combat, Roadrunner, and Noise, and the underground tape trading industry in both Europe and North America. The genre was commercially successful from approximately 1985 through 1991, bringing prominence to Metallica, Slayer, Megadeth, and Anthrax, all grouped together as the "Big Four" of U.S. thrash metal. Other bands, such as Overkill, Metal Church, Nuclear Assault, Flotsam and Jetsam, and Bay Area acts Exodus, Testament and Death Angel, never achieved the same level of success as the "Big Four" but had also developed a strong following in the metal community, through MTV's Headbangers Ball or otherwise. Some of the most popular international thrash metal bands from this era were Brazil's Sepultura, Canada's Voivod and Annihilator, Switzerland's Coroner, England's Onslaught, and the genre's German "Big Four": Kreator, Destruction, Sodom, and Tankard.

    The thrash metal genre had declined in popularity by the mid-1990s, due to the commercial success of numerous genres such as alternative rock, grunge, and later pop-punk and nu metal. In response, some bands either disbanded or moved away from their thrash metal roots and more towards groove metal or alternative metal. The genre has seen a resurgence in popularity since the 2000s, with the arrival of various bands such as Bonded by Blood, Evile, Hatchet, Havok, Lamb of God, Municipal Waste, and Warbringer, who have all been credited for leading the so-called "thrash metal revival" scene.`,
    subgenreOf: ["metal"],
    subgenres: ["technical thrash metal"],
    fusionGenres: ["crossover thrash"],
    influencedBy: ["hardcore punk", "nwobhm", "speed metal"],
    influencedGenres: ["groove metal", "stenchcore"],
  }

  return (
    <>
      <Sidebar className="absolute" variant="floating">
          <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          ><Undo2/></Button>
        <SidebarHeader className="mb-2">
          <span>Thrash Metal</span>
            <p 
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`text-sm break-words text-muted-foreground cursor-pointer hover:text-gray-400 
              ${
            isExpanded
              ? "text-muted-foreground"
              : "line-clamp-3 overflow-hidden"
          }`}>{genreRelationships.description}</p>
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
         <SidebarRail />
        {/* <SidebarFooter /> */}
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  )
}