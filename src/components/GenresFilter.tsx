import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, ChevronDown, Minus } from "lucide-react";
import { Genre, GenreClusterMode, GraphType } from "@/types";
import { isTopLevelGenre } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  // Compute the set of top level genres per current cluster mode
  const topLevelGenres = useMemo(
    () => genres.filter((g) => isTopLevelGenre(g, genreClusterMode)),
    [genres, genreClusterMode]
  );

  // Track selected children per parent id. Use Set for O(1) toggles.
  const [selectedChildren, setSelectedChildren] = useState<Record<string, Set<string>>>({});

  // Keep selection keys in sync with the visible top-level list, preserving prior picks
  useEffect(() => {
    setSelectedChildren((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const g of topLevelGenres) {
        next[g.id] = prev[g.id] ?? new Set<string>();
      }
      return next;
    });
  }, [topLevelGenres]);


  const getChildGenres = (parent: Genre) => {
    return [
      { id: `${parent.id}-child-a`, name: `death ${parent.name}` } as Genre,
      { id: `${parent.id}-child-b`, name: `post ${parent.name}` } as Genre,
      { id: `${parent.id}-child-c`, name: `industrial ${parent.name}` } as Genre,
      { id: `${parent.id}-child-d`, name: `black ${parent.name}` } as Genre,
    ];
  };

  type TriState = "unchecked" | "indeterminate" | "checked";

  const getParentState = (parent: Genre): TriState => {
    const children = getChildGenres(parent);
    const sel = selectedChildren[parent.id] ?? new Set<string>();
    if (sel.size === 0) return "unchecked";
    if (sel.size === children.length) return "checked";
    return "indeterminate";
  };

  const toggleParent = (parent: Genre) => {
    const children = getChildGenres(parent);
    const nextState = getParentState(parent) === "checked" ? "unchecked" : "checked";
    setSelectedChildren((prev) => {
      const copy = { ...prev };
      copy[parent.id] = new Set<string>(
        nextState === "checked" ? children.map((c) => c.id) : []
      );
      return copy;
    });
    if (nextState === "checked") onParentSelect(parent);
    else onParentDeselect(parent);
  };

  const isChildSelected = (parent: Genre, childId: string) => {
    return selectedChildren[parent.id]?.has(childId) ?? false;
  };

  const toggleChild = (parent: Genre, child: Genre) => {
    setSelectedChildren((prev) => {
      const copy = { ...prev };
      const set = new Set<string>(copy[parent.id] ?? []);
      if (set.has(child.id)) set.delete(child.id);
      else set.add(child.id);
      copy[parent.id] = set;
      return copy;
    });
    // Keep existing click behavior for child items
    onParentClick(child);
  };

  const totalSelected = topLevelGenres.reduce((acc, g) => acc + (getParentState(g) !== "unchecked" ? 1 : 0), 0);

  if (graphType !== "artists") return null;

  return (
    <ResponsivePanel
      trigger={
        <Button size="lg" variant="outline">{`Genres (${totalSelected})`}
          <ChevronDown />
        </Button>
      }
      className="p-0 overflow-hidden"
      side="bottom"
    >
      <Command>
        <CommandInput placeholder="Filter genres..." />
        <CommandList>
          <CommandEmpty>No genres found.</CommandEmpty>
          <CommandGroup>
            {topLevelGenres.map((genre) => {
              const state = getParentState(genre);
              return (
                <Collapsible key={genre.id}>
                  <CommandItem
                    // `value` is what cmdk uses for built-in filtering
                    value={genre.name}
                    className="flex w-full items-center justify-between gap-2"
                    onSelect={() => toggleParent(genre)}
                  >
                    <div className="flex items-center gap-2">
                      {state === "checked" && <Check className="opacity-100" />}
                      {state === "indeterminate" && <Minus className="opacity-100" />}
                      {state === "unchecked" && <Check className="hidden" />}
                      <span>{genre.name}</span>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Toggle subgenres"
                      >
                        <ChevronsUpDown />
                      </Button>
                    </CollapsibleTrigger>
                  </CommandItem>
                  <CollapsibleContent>
                    <div className="pl-9">
                      {getChildGenres(genre).map((child) => {
                        const childChecked = isChildSelected(genre, child.id);
                        return (
                          <CommandItem
                            key={child.id}
                            value={child.name}
                            onSelect={() => toggleChild(genre, child)}
                            className="flex items-center gap-2"
                          >
                            <Check className={childChecked ? "" : "hidden"} />
                            <span>{child.name}</span>
                          </CommandItem>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsivePanel>
  );
}
