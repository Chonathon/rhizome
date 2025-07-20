import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Artist, BasicNode, Genre } from "@/types";
import { isGenre } from "@/lib/utils";

interface AppSidebarProps {
  recentSelections: BasicNode[];
  onGenreSelect: (genre: Genre) => void;
  onArtistSelect: (artist: Artist) => void;
  removeRecentSelection: (id: string) => void;
}

export function AppSidebar({ recentSelections, onGenreSelect, onArtistSelect, removeRecentSelection }: AppSidebarProps) {
  const onItemSelect = (selection: BasicNode) => {
    if (isGenre(selection)) {
      onGenreSelect(selection as Genre);
    } else {
      onArtistSelect(selection as Artist);
    }
  }

  return (
    <Sidebar className="absolute" variant="inset">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup heading="Recent Selections">
          <SidebarMenu>
            {recentSelections.map((selection) => (
              <SidebarMenuItem
                key={selection.id}
                onClick={() => onItemSelect(selection)}
                isActive={false}
              >
                <span>{selection.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSelection(selection.id);
                  }}
                  className="h-auto p-1"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}