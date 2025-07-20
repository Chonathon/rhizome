import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { Search } from "@/components/Search"

export function AppSidebar() {
  return (
    <Sidebar className="absolute" variant="inset">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        {/* <SidebarMenu />
         */}
        
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}