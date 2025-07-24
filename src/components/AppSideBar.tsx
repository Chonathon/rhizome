import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { Search } from "@/components/Search"
import React from "react"

export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar className="absolute rounded-3xl" variant="floating">
        <SidebarHeader />
        <SidebarContent>
          <SidebarGroup />
          {/* <SidebarMenu />
           */}

          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  )
}