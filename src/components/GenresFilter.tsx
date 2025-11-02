// GenresFilter renders a searchable, collapsible list of top-level genres
// with tri-state selection (unchecked / indeterminate / checked). Parents can
// be toggled as a whole, or individual child subgenres can be toggled.
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, ChevronDown, Minus, X } from "lucide-react";
import {Genre, GenreClusterMode, GraphType, InitialGenreFilter} from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useTriStateSelection } from "@/hooks/useTriStateSelection";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import {isRootGenre, getParentChildrenMap} from "@/lib/utils";
import { PARENT_FIELD_MAP, CHILD_FIELD_MAP } from "@/constants";
import {g} from "framer-motion/m";

// Props control available genres, clustering mode, and external selection callbacks.
export default function GenresFilter({
  genres = [],
  genreClusterModes,
  graphType,
  onGenreSelectionChange,
  initialSelection,
}: {
  genres?: Genre[];
  genreClusterModes: GenreClusterMode[];
  graphType: GraphType;
  onGenreSelectionChange: (selectedIDs: string[]) => void;
  initialSelection: InitialGenreFilter;
}) {
  // Compute the set of top-level genres based on the current cluster modes.
  const topLevelGenres = useMemo(() => {
    const viaUtil = genres.filter((g) => isRootGenre(g, genreClusterModes));
    if (viaUtil.length > 0) return viaUtil;
    // Fallback if util returns none
    return genres.filter((g) =>
      genreClusterModes.some((mode) =>
        (g[PARENT_FIELD_MAP[mode]]?.length ?? 0) > 0 &&
        (g[CHILD_FIELD_MAP[mode]]?.length ?? 0) > 0
      )
    );
  }, [genres, genreClusterModes]);

  const parentChildMap = useMemo(() => {
    return getParentChildrenMap(topLevelGenres, genres, genreClusterModes);
  }, [topLevelGenres]);

  // Default all collapsibles closed. Map is keyed by parent genre id.
  const defaultOpenMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const g of topLevelGenres) m[g.id] = false; // all closed by default
    return m;
  }, [topLevelGenres]);

  // Search query (declared early so selection logic can reference it)
  const [query, setQuery] = useState("");

  const childrenSearchResults = useRef<string[]>([]);

  // Tri-state selection logic is handled by a reusable hook.
  const {
    parentSelected,
    selectedChildren,
    setParentSelected,
    setSelectedChildren,
    getParentState,
    toggleParent,
    toggleChild,
  } = useTriStateSelection(topLevelGenres, (p) => parentChildMap.get(p.id) || [], {
    // While searching, do not bulk-toggle children when a parent is toggled.
    bulkToggleChildren: !query.trim(),
    initialParentSelected: initialSelection.isRoot && initialSelection.genre ? { [initialSelection.genre.id]: true } : undefined,
    initialSelectedChildren: initialSelection.parents,
  });

  // Collapsible open/closed state.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(defaultOpenMap);

  // When searching, auto-open parents that match or have matching children.
  // Clearing the query resets to default closed state.
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedGroupRef = useRef<HTMLDivElement | null>(null);
  const prevSelectedHeightRef = useRef<number>(0);

  // Computed: Any selection active? This doesn't count children genres
  const hasAnySelection = topLevelGenres.some((g) => parentSelected[g.id] ?? false);

  // Clear all selections for all parents/children
  const clearAll = () => {
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

  // Toggle only the parent state without affecting children (for Selected section)
  const toggleParentOnly = (parent: Genre) => {
    setParentSelected((prev) => ({
      ...prev,
      [parent.id]: !prev[parent.id]
    }));
  };

  useEffect(() => {
    const q = query.trim().toLowerCase();
    childrenSearchResults.current = [];
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
        const children = parentChildMap.get(g.id);
        const childMatch = children ? children
          .some((c) => c.name.toLowerCase().includes(q)) : false;
        next[g.id] = parentMatch || childMatch;
      }
      return next;
    });
  }, [query]);

  // Determine the parent's tri-state based on its own selection and child selections.
  // Read-only helper to check if a given child is selected under a parent.
  const isChildSelected = (parent: Genre, childId: string) => {
    return selectedChildren[parent.id]?.has(childId) ?? false;
  };

  // Show count of selected parents + selected children next to the clear button.
  const totalSelected = useMemo(() => {
    return topLevelGenres.reduce((acc, g) => {
      const parentCount = parentSelected[g.id] ? 1 : 0;
      const childCount = selectedChildren[g.id]?.size ?? 0;
      return acc + parentCount + childCount;
    }, 0);
  }, [topLevelGenres, parentSelected, selectedChildren]);

  // Flat selected lists for the Selected group
  const selectedParents = useMemo(
    () => topLevelGenres.filter((g) => parentSelected[g.id]),
    [topLevelGenres, parentSelected]
  );

  const selectedChildrenFlat = useMemo(
    () =>
      topLevelGenres.flatMap((parent) => {
        const set = selectedChildren[parent.id];
        if (!set || set.size === 0) return [] as { parent: Genre; child: Genre }[];
        const children = parentChildMap.get(parent.id);
        //isMountingRef.current = false;
        return children ? children
          .filter((c) => set.has(c.id))
          .map((child) => ({ parent, child })) : [];
      }),
    [topLevelGenres, selectedChildren]
  );

  // Triggers loading artists on selection of genres
  useEffect(() => {
    const ids = [...selectedParents.map(p => p.id), ...selectedChildrenFlat.map(c => c.child.id)];
    onGenreSelectionChange(ids);
  }, [selectedParents, selectedChildrenFlat]);

  // Preserve scroll position when the Selected group grows/shrinks above the list.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const prevHeight = prevSelectedHeightRef.current || 0;
    const nextHeight = selectedGroupRef.current?.offsetHeight || 0;
    const delta = nextHeight - prevHeight;

    if (delta !== 0 && list.scrollTop > 0) {
      // Adjust scrollTop by the height delta added/removed above current view
      list.scrollTop = list.scrollTop + delta;
    }
    prevSelectedHeightRef.current = nextHeight;
  }, [selectedParents.length, selectedChildrenFlat.length, query]);

  // These were used to try to make fusion/influence work
  const getChildSearchResults = (parent: Genre) => {
    const children = parentChildMap.get(parent.id);
    if (!children || !children.length) return [];
    const childMap = new Map();
    children.forEach(c => {
      childMap.set(c.id, c);
    });
  }
  const childDupeCheck = (id: string) => {
    if (childrenSearchResults.current.includes(id)) return false;
    if (query.trim().length) {
      childrenSearchResults.current = [...childrenSearchResults.current, id];
    }
    return true;
  }

  if (graphType !== "artists") return null;

  return (
    // ResponsivePanel + Command = ComboBox
    <ResponsivePanel
    onOpenChange={(open) => {
      // Default collapsibles to closed when the panel opens.
      if (open) setOpenMap(defaultOpenMap);
    }}
      trigger={
        // Collapsed Genres Button
        <Button size="lg" variant="outline" className={`${totalSelected > 0 ? "px-4" : ""}`}> 
        {totalSelected === 1
        ? (selectedParents[0]?.name ?? selectedChildrenFlat[0]?.child.name)
        : "Genres" }
          {totalSelected > 0 ? (
            <Button
              asChild
              size="icon"
              variant="secondary"
              className="-m-1 w-6 h-6 group"
            >
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear all filters"
                className="group"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                title="Clear all genre selections"
              >
                {totalSelected > 1 ? (
                  <>
                  <span className="group-hover:opacity-0 text-xs leading-none">{totalSelected}</span>
                  <X className="group-hover:opacity-100 absolute opacity-0 h-4 w-4" />
                  </>
                ) : (
                  <X className="h-4 w-4" />
                )}
              </span>
            </Button>
          ) : (
            <ChevronDown />
          )}
        </Button>
      }
      className="p-0 overflow-hidden"
      side="bottom"
      >
      {/* Expanded List */}
      <Command>
        <CommandInput placeholder="Filter genres..." value={query} onValueChange={setQuery} />
        <CommandList ref={listRef} key={query.trim() ? "searching" : "empty"}>
          <CommandEmpty>No genres found.</CommandEmpty>
          {/* Selected Group */}
          {(selectedParents.length > 0 || selectedChildrenFlat.length > 0) && (
            <div ref={selectedGroupRef}>
            <CommandGroup className='bg-accent/40 border-b' aria-labelledby="Selected Genres">
              {selectedParents.map((genre) => (
                <CommandItem
                  key={`sel-parent-${genre.id}`}
                  value={`selected-parent:${genre.id} ${genre.name}`}
                  onSelect={() => toggleParentOnly(genre)}
                  className="flex items-center gap-2"
                >
                  <Check className="opacity-100" />
                  <span>{genre.name}</span>
                </CommandItem>
              ))}
              {selectedChildrenFlat.map(({ parent, child }) => (
                <CommandItem
                  key={`sel-child-${parent.id}-${child.id}`}
                  value={`selected-child:${parent.id}:${child.id} ${child.name} ${parent.name}`}
                  onSelect={() => toggleChild(parent, child)}
                  className="flex items-center gap-2"
                >
                  <Check className="opacity-100" />
                  <span>{child.name}</span>
                </CommandItem>
              ))}
              {/* <Button className="mt-1 mb-2" size={'sm'} variant={'ghost'} onClick={() => clearAll()}>Clear</Button> */}
            {/* <CommandSeparator /> */}
            </CommandGroup>
            </div>
          )
        }
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
                      {parentChildMap.get(genre.id).map((child) => {
                        if (!child) return null;
                        const childChecked = isChildSelected(genre, child.id);
                        return (
                          <CommandItem
                            key={`${genre.id}-${child.id}`}
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
