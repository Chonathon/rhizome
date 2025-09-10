// GenresFilter renders a searchable, collapsible list of top-level genres
// with tri-state selection (unchecked / indeterminate / checked). Parents can
// be toggled as a whole, or individual child subgenres can be toggled.
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, ChevronDown, Minus, X } from "lucide-react";
import { Genre, GenreClusterMode, GraphType } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTriStateSelection } from "@/hooks/useTriStateSelection";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { isTopLevelGenre, parentFieldMap, childFieldMap } from "@/lib/utils";

// Props control available genres, clustering mode, and external selection callbacks.
export default function GenresFilter({
  genres = [],
  genreClusterModes,
  onParentClick,
  onParentDeselect,
  onParentSelect,
  graphType,
}: {
  genres?: Genre[];
  genreClusterModes: GenreClusterMode[];
  onParentClick: (genre: Genre) => void;
  onParentDeselect: (genre: Genre) => void;
  onParentSelect: (genre: Genre) => void;
  graphType: GraphType;
}) {
  // Compute the set of top-level genres based on the current cluster modes.
  const topLevelGenres = useMemo(() => {
    const viaUtil = genres.filter((g) => isTopLevelGenre(g, genreClusterModes));
    if (viaUtil.length > 0) return viaUtil;
    // Fallback if util returns none
    return genres.filter((g) =>
      genreClusterModes.some((mode) =>
        (g[parentFieldMap[mode]]?.length ?? 0) > 0 &&
        (g[childFieldMap[mode]]?.length ?? 0) > 0
      )
    );
  }, [genres, genreClusterModes]);

  // Default all collapsibles closed. Map is keyed by parent genre id.
  const defaultOpenMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const g of topLevelGenres) m[g.id] = false; // all closed by default
    return m;
  }, [topLevelGenres]);

  // Search query (declared early so selection logic can reference it)
  const [query, setQuery] = useState("");

  // Placeholder: generate example child subgenres for each parent.
  const getChildGenres = (parent: Genre) => {
    return [
      { id: `${parent.id}-child-a`, name: `death ${parent.name}` } as Genre,
      { id: `${parent.id}-child-b`, name: `post ${parent.name}` } as Genre,
      { id: `${parent.id}-child-c`, name: `industrial ${parent.name}` } as Genre,
      { id: `${parent.id}-child-d`, name: `black ${parent.name}` } as Genre,
    ];
  };

  // Tri-state selection logic is handled by a reusable hook.
  const {
    parentSelected,
    selectedChildren,
    setParentSelected,
    setSelectedChildren,
    getParentState,
    toggleParent,
    toggleChild,
  } = useTriStateSelection(topLevelGenres, (p) => getChildGenres(p), {
    // While searching, do not bulk-toggle children when a parent is toggled.
    bulkToggleChildren: !query.trim(),
    onParentSelect: onParentSelect,
    onParentDeselect: onParentDeselect,
    onChildClick: (child) => onParentClick(child as Genre),
  });

  // Collapsible open/closed state.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(defaultOpenMap);

  // Reset collapsible open state when the top-level set changes.
  useEffect(() => {
    setOpenMap(defaultOpenMap);
  }, [defaultOpenMap]);

  // When searching, auto-open parents that match or have matching children.
  // Clearing the query resets to default closed state.
  const listRef = useRef<HTMLDivElement | null>(null);

  // Computed: Any selection active?
  const hasAnySelection = topLevelGenres.some((g) => parentSelected[g.id] ?? false);

  // Clear all selections for all parents/children
  const clearAll = () => {
    const previouslySelected = topLevelGenres.filter((g) => parentSelected[g.id]);
    // Notify external deselect handlers for parents that were selected
    previouslySelected.forEach((g) => onParentDeselect(g));
    setParentSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const g of topLevelGenres) next[g.id] = false;
      return next;
    });
    setSelectedChildren((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const g of topLevelGenres) next[g.id] = new Set<string>();
      return next;
    });
  };

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

  

  // Determine the parent's tri-state based on its own selection and child selections.
  // Read-only helper to check if a given child is selected under a parent.
  const isChildSelected = (parent: Genre, childId: string) => {
    return selectedChildren[parent.id]?.has(childId) ?? false;
  };

  // Show count of selected parents + selected children next to the trigger button.
  const totalSelected = useMemo(() => {
    return topLevelGenres.reduce((acc, g) => {
      const parentCount = parentSelected[g.id] ? 1 : 0;
      const childCount = selectedChildren[g.id]?.size ?? 0;
      return acc + parentCount + childCount;
    }, 0);
  }, [topLevelGenres, parentSelected, selectedChildren]);

  if (graphType !== "artists") return null;

  return (
    // ResponsivePanel + Command = ComboBox
    <ResponsivePanel
    onOpenChange={(open) => {
      // Default collapsibles to closed when the panel opens.
      if (open) setOpenMap(defaultOpenMap);
    }}
      trigger={
        <Button size="lg" variant="outline" className={`${hasAnySelection ? "px-4" : ""}`}>
          {`Genres`}
          {hasAnySelection ? (
            <Button
              size="icon"
              variant="secondary"
              aria-label="Clear all filters"
              className="-m-1.5 w-7 h-7 group"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              title="Clear all filters"
            >
              <span className="group-hover:hidden text-xs leading-none">{totalSelected}</span>
              <X className="hidden group-hover:block h-4 w-4" />
            </Button>
          ) : (
            <ChevronDown />
          )}
        </Button>
      }
      className="p-0 overflow-hidden"
      side="bottom"
      >
      <Command>
        <CommandInput placeholder="Filter genres..." value={query} onValueChange={setQuery} />
        <CommandList ref={listRef} key={query.trim() ? "searching" : "empty"}>
          <CommandEmpty>No genres found.</CommandEmpty>
          <CommandGroup className='sr-only' heading="Selections">
            <CommandItem>



            </CommandItem>
          </CommandGroup>
          <CommandGroup>
            {topLevelGenres.map((genre) => {
              // In search mode, treat the list as flat: if the parent is selected, show a full check.
              const state = query.trim()
                ? ((parentSelected[genre.id] ? "checked" : "unchecked") as "checked" | "unchecked")
                : getParentState(genre);
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
                        className="-mr-2 -my-2"
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
