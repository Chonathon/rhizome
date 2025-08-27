import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Genre, GenreClusterMode, GraphType } from "@/types";
import {clusterColors, isTopLevelGenre} from "@/lib/utils";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import {useEffect, useState} from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function GenresFilter({
  genres = [],
  genreClusterMode,
  onParentClick,
  onParentDeselect,
  onParentSelect,
  graphType,
}: {
  genres?: Genre[];
  genreClusterMode: GenreClusterMode;
  onParentClick: (genre: Genre) => void;
  onParentDeselect: (genre: Genre) => void;
  onParentSelect: (genre: Genre) => void;
  graphType: GraphType;
}) {
  const [checked, setChecked] = useState<boolean[]>([]);
  // Local state for mock child genres (since they are not part of `genres`)
  const [childChecked, setChildChecked] = useState<Record<string, boolean>>({});

  const onCheckboxChange = (genre: Genre, index: number) => {
    if (checked[index]) {
      onParentDeselect(genre);
    } else {
      onParentSelect(genre);
    }
    setChecked(checked.map((c, i) => i === index ? !c : c));
  }

  // const onGenreClick = (genre: Genre, index: number) => {
  //   onParentClick(genre);
  //   setChecked(checked.map((c, i) => i === index));
  // }


// Temporary: generate fake child genres for any parent so UI always shows nested checkboxes
const getChildGenres = (parent: Genre) => {
  return [
    { id: `${parent.id}-child-a`, name: `death ${parent.name}` } as Genre,
    { id: `${parent.id}-child-b`, name: `post ${parent.name}` } as Genre,
  ];
};

// Helpers to compute parent ↔ child checkbox state
const getChildIds = (parent: Genre) => getChildGenres(parent).map((c) => `child-${c.id}`);

const computeParentCheckedState = (parent: Genre): boolean | "indeterminate" => {
  const ids = getChildIds(parent);
  if (!ids.length) return false;
  const states = ids.map((id) => !!childChecked[id]);
  const all = states.every(Boolean);
  const none = states.every((s) => !s);
  if (all) return true;
  if (none) return false;
  return "indeterminate";
};

  return graphType !== "artists" ? null : (
    <ResponsivePanel
      trigger={
        
          <Button size='lg' variant='outline'>Genre
            <ChevronDown />
          </Button>
      }
      className="p-2 overflow-hidden"
      side="bottom"
    >
      {/* scrolling container */}
      <div className="overflow-y-auto max-h-120 rounded-2xl border border-accent shadow-sm bg-accent dark:dark:bg-background">
        <div className="flex flex-col gap-0.5 py-2 pl-4 pr-2">
          {/* Checkbox Items */}
          {genres
            .filter((genre) => isTopLevelGenre(genre, genreClusterMode))
            .map((genre: Genre, index: number) => (
              <Collapsible key={genre.id} className="w-full flex flex-col">
                {/* Row: parent checkbox + toggle */}
                <div className="flex w-full items-center">
                  <Label
                    htmlFor={genre.id}
                    className="w-full flex items-center py-1 cursor-pointer gap-2"
                  >
                    <Checkbox
                      checked={computeParentCheckedState(genre)}
                      id={genre.id}
                      onCheckedChange={(next) => {
                        const ids = getChildIds(genre);
                        // Update all children to the parent's next state (true/false)
                        setChildChecked((prev) => {
                          const draft = { ...prev };
                          ids.forEach((id) => {
                            draft[id] = !!next;
                          });
                          return draft;
                        });
                        // Maintain legacy parent array for upstream callbacks
                        setChecked((prev) => prev.map((c, i) => (i === index ? !!next : c)));
                        if (next) {
                          onParentSelect(genre);
                        } else {
                          onParentDeselect(genre);
                        }
                      }}
                      aria-checked={computeParentCheckedState(genre) === "indeterminate" ? "mixed" : undefined}
                    />
                    {genre.name}
                  </Label>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Toggle subgenres for ${genre.name}`}
                    >
                      <ChevronsUpDown />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                {/* Nested subgenres */}
                <CollapsibleContent className="py-2 pl-6 space-y-1">
                  {(() => {
                    const children = getChildGenres(genre);
                    if (!children.length) {
                      return (
                        <Label>No subgenres</Label>
                      );
                    }
                    return children.map((child) => {
                      const childId = `child-${child.id}`;
                      return (
                        <Label
                          key={child.id}
                          htmlFor={childId}
                          className="flex items-center py-2 cursor-pointer"
                        >
                          <Checkbox
                            id={childId}
                            checked={!!childChecked[childId]}
                            onCheckedChange={() => {
                              setChildChecked((prev) => {
                                const next = !prev[childId];
                                const updated = { ...prev, [childId]: next };
                                return updated;
                              });
                              // After toggling a child, update parent boolean in `checked[]` to true if all children now selected, false otherwise
                              const siblingIds = getChildIds(genre);
                              const willBeAllSelected = siblingIds.every((id) => id === childId ? !childChecked[childId] : !!childChecked[id]);
                              setChecked((prev) => prev.map((c, i) => (i === index ? willBeAllSelected : c)));
                            }}
                          />
                          {child.name}
                        </Label>
                      );
                    });
                  })()}
                </CollapsibleContent>
              </Collapsible>
            ))}
        </div>
      </div>
        {/* overflow gradient */}
        {/* TODO: make overflow gradient a reusable component */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white/80 to-transparent dark:from-black/27" />
    </ResponsivePanel>
  );
}
