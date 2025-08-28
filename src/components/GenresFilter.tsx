// GenresFilter renders a searchable, collapsible list of top-level genres
// with tri-state selection (unchecked / indeterminate / checked). Parents can
// be toggled as a whole, or individual child subgenres can be toggled.
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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Props control available genres, clustering mode, and external selection callbacks.
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
  // Compute the set of top-level genres based on the current cluster mode.
  const topLevelGenres = useMemo(
    () => genres.filter((g) => isTopLevelGenre(g, genreClusterMode)),
    [genres, genreClusterMode]
  );

  // Default all collapsibles closed. Map is keyed by parent genre id.
  const defaultOpenMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const g of topLevelGenres) m[g.id] = false; // all closed by default
    return m;
  }, [topLevelGenres]);

  // Track selected children per parent id. Using Set makes toggling O(1).
  const [selectedChildren, setSelectedChildren] = useState<Record<string, Set<string>>>({});
  // Track whether a parent is selected (independent of its children).
  const [parentSelected, setParentSelected] = useState<Record<string, boolean>>({});

  // Keep selection maps in sync when the set of top-level genres changes.
  // Preserves previous selections for stable keys.
  useEffect(() => {
    setSelectedChildren((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const g of topLevelGenres) {
        next[g.id] = prev[g.id] ?? new Set<string>();
      }
      return next;
    });
    setParentSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const g of topLevelGenres) {
        next[g.id] = prev[g.id] ?? false;
      }
      return next;
    });
    // Reset collapsible open state when the top-level set changes.
    setOpenMap(defaultOpenMap);
  }, [topLevelGenres]);

  // Search query and collapsible open/closed state.
  const [query, setQuery] = useState("");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(defaultOpenMap);

  // When searching, auto-open parents that match or have matching children.
  // Clearing the query resets to default closed state.
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q === "") {
      // Reset to default open state when the search is cleared
      setOpenMap(defaultOpenMap);
      // Also reset scroll to top so users see the first items again
      // after clearing their input.
      listRef.current?.scrollTo({ top: 0 });
      return;
    }
    // Open only parents that have a matching parent name or at least one matching child
    setOpenMap((prev) => {
      const next: Record<string, boolean> = {};
      for (const g of topLevelGenres) {
        const parentMatch = g.name.toLowerCase().includes(q);
        const childMatch = getChildGenres(g)
          .some((c) => c.name.toLowerCase().includes(q));
        next[g.id] = parentMatch || childMatch;
      }
      return next;
    });
  }, [query, topLevelGenres]);

  // Placeholder: generate example child subgenres for each parent.
  const getChildGenres = (parent: Genre) => {
    return [
      { id: `${parent.id}-child-a`, name: `death ${parent.name}` } as Genre,
      { id: `${parent.id}-child-b`, name: `post ${parent.name}` } as Genre,
      { id: `${parent.id}-child-c`, name: `industrial ${parent.name}` } as Genre,
      { id: `${parent.id}-child-d`, name: `black ${parent.name}` } as Genre,
    ];
  };

  type TriState = "unchecked" | "indeterminate" | "checked";

  // Determine the parent's tri-state based on its own selection and child selections.
  const getParentState = (parent: Genre): TriState => {
    const children = getChildGenres(parent);
    const sel = selectedChildren[parent.id] ?? new Set<string>();
    const isParent = parentSelected[parent.id] ?? false;
    if (!isParent) return "unchecked";
    // Show a full check when either all children are selected or none are selected (parent-only)
    if (sel.size === children.length || sel.size === 0) return "checked";
    return "indeterminate"; // parent is selected and some, but not all, children are selected
  };

  // Toggle a parent: mark the parent selected and select/deselect all its children.
  const toggleParent = (parent: Genre) => {
    const children = getChildGenres(parent);
    const currentlySelected = parentSelected[parent.id] ?? false;
    const nextSelected = !currentlySelected;

    setParentSelected((prev) => ({ ...prev, [parent.id]: nextSelected }));

    // When a search query is active, toggling a parent should not bulk
    // select/deselect its children. Only toggle the parent selection.
    if (!query.trim()) {
      setSelectedChildren((prev) => {
        const copy = { ...prev };
        copy[parent.id] = new Set<string>(nextSelected ? children.map((c) => c.id) : []);
        return copy;
      });
    }

    if (nextSelected) onParentSelect(parent);
    else onParentDeselect(parent);
  };

  // Read-only helper to check if a given child is selected under a parent.
  const isChildSelected = (parent: Genre, childId: string) => {
    return selectedChildren[parent.id]?.has(childId) ?? false;
  };

  // Toggle a child within a parent. If any child is selected, mark the parent as selected.
  // Also forwards the click event via onParentClick to external handlers.
  const toggleChild = (parent: Genre, child: Genre) => {
    let newSize = 0;
    setSelectedChildren((prev) => {
      const copy = { ...prev };
      const set = new Set<string>(copy[parent.id] ?? []);
      if (set.has(child.id)) set.delete(child.id);
      else set.add(child.id);
      copy[parent.id] = set;
      newSize = set.size;
      return copy;
    });

    // If any child is selected, ensure the parent is marked selected.
    if (newSize > 0) {
      setParentSelected((prev) => ({ ...prev, [parent.id]: true }));
    }

    // Keep existing click behavior for child items
    onParentClick(child);
  };

  // Show count of selected parents next to the trigger button.
  const totalSelected = topLevelGenres.reduce((acc, g) => acc + ((parentSelected[g.id] ?? false ? 1 : 0)), 0);

  if (graphType !== "artists") return null;

  return (
    // ResponsivePanel + Command = ComboBox
    <ResponsivePanel
    onOpenChange={(open) => {
      // Default collapsibles to closed when the panel opens.
      if (open) setOpenMap(defaultOpenMap);
    }}
    trigger={
      <Button size="lg" variant="outline">{`Genres (${totalSelected})`}
          <ChevronDown />
        </Button>
      }
      className="p-0 overflow-hidden"
      side="bottom"
      >
      <Command>
        <CommandInput placeholder="Filter genres..." value={query} onValueChange={setQuery} />
        <CommandList ref={listRef} key={query.trim() ? "searching" : "empty"}>
          <CommandEmpty>No genres found.</CommandEmpty>
          <CommandGroup>
            {topLevelGenres.map((genre) => {
              const state = getParentState(genre);
              const isOpen = openMap[genre.id] ?? false;
              return (
                // Each top-level genre is a collapsible row with a trigger to open child items
                <Collapsible key={genre.id} open={isOpen} onOpenChange={(open) => setOpenMap((prev) => ({ ...prev, [genre.id]: open }))}>
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
                    {query ? "" : <CollapsibleTrigger asChild>
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
                    </CollapsibleTrigger>}
                  </CommandItem>
                  <CollapsibleContent>
                    <div className={query ? "" : "pl-8"}>
                      {getChildGenres(genre).map((child) => {
                        const childChecked = isChildSelected(genre, child.id);
                        return (
                          <CommandItem
                            key={child.id}
                            value={child.name}
                            onSelect={() => toggleChild(genre, child)}
                            className={`flex items-center gap-2 `}
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
