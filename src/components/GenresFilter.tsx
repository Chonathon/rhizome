// GenresFilter: flat list with section headers per parent genre.
// Each parent genre = labelled section + selectable item + children below.
// AND logic is flat: every selected ID must match (no unit grouping needed).
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, X } from "lucide-react";
import { Genre, GenreClusterMode, GraphType, InitialGenreFilter } from "@/types";
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
import { isRootGenre, getParentChildrenMap } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PARENT_FIELD_MAP, CHILD_FIELD_MAP } from "@/constants";
import { BadgeIndicator } from "@/components/BadgeIndicator";

export default function GenresFilter({
  genres = [],
  genreClusterModes,
  graphType,
  onGenreSelectionChange,
  initialSelection,
  selectedGenreIds = [],
  genreColorMap,
  onOperatorChange,
}: {
  genres?: Genre[];
  genreClusterModes: GenreClusterMode[];
  graphType: GraphType;
  onGenreSelectionChange: (selectedIDs: string[]) => void;
  onOperatorChange?: (operator: 'or' | 'and', andUnits: string[][]) => void;
  initialSelection: InitialGenreFilter;
  selectedGenreIds?: string[];
  genreColorMap?: Map<string, string>;
}) {
  const topLevelGenres = useMemo(() => {
    const viaUtil = genres.filter((g) => isRootGenre(g, genreClusterModes));
    if (viaUtil.length > 0) return viaUtil;
    return genres.filter((g) =>
      genreClusterModes.some((mode) =>
        (g[PARENT_FIELD_MAP[mode]]?.length ?? 0) > 0 &&
        (g[CHILD_FIELD_MAP[mode]]?.length ?? 0) > 0
      )
    );
  }, [genres, genreClusterModes]);

  const parentChildMap = useMemo(
    () => getParentChildrenMap(topLevelGenres, genres, genreClusterModes),
    [topLevelGenres, genres, genreClusterModes]
  );

  const genreById = useMemo(() => {
    const m = new Map<string, Genre>();
    for (const g of genres) m.set(g.id, g);
    return m;
  }, [genres]);

  // Flat selection: a Set of genre IDs (parents and children mixed)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    if (initialSelection.isRoot && initialSelection.genre) {
      ids.add(initialSelection.genre.id);
    }
    for (const childSet of Object.values(initialSelection.parents)) {
      for (const childId of childSet) ids.add(childId);
    }
    return ids;
  });

  const [operator, setOperator] = useState<'or' | 'and'>('or');
  const [query, setQuery] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);
  const isSyncingFromExternal = useRef(false);
  const lastAppliedState = useRef<{ ids: string[]; parentSignature: string }>({
    ids: [],
    parentSignature: "",
  });

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllSection = (parent: Genre) => {
    const children = parentChildMap.get(parent.id) || [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(parent.id);
      for (const child of children) next.add(child.id);
      return next;
    });
  };

  const clearSection = (parent: Genre) => {
    const children = parentChildMap.get(parent.id) || [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(parent.id);
      for (const child of children) next.delete(child.id);
      return next;
    });
  };

  const clearAll = () => {
    setSelectedIds(new Set());
    setOperator('or');
  };

  // 'all' | 'some' | 'none' — for the section header's all/clear button label
  const getSectionState = (parent: Genre): 'all' | 'some' | 'none' => {
    const children = parentChildMap.get(parent.id) || [];
    const allIds = [parent.id, ...children.map((c) => c.id)];
    const count = allIds.filter((id) => selectedIds.has(id)).length;
    if (count === 0) return 'none';
    if (count === allIds.length) return 'all';
    return 'some';
  };

  const totalSelected = selectedIds.size;

  // Sync from external selectedGenreIds (prevents callback loops)
  useEffect(() => {
    const normalized = Array.from(new Set((selectedGenreIds ?? []).filter(Boolean)));
    const parentSignature = topLevelGenres.map((g) => g.id).join("|");
    const prev = lastAppliedState.current;
    const prevSet = new Set(prev.ids);
    const sameSelection =
      normalized.length === prev.ids.length &&
      normalized.every((id) => prevSet.has(id));
    const sameParents = prev.parentSignature === parentSignature;
    if (sameSelection && sameParents) return;

    lastAppliedState.current = { ids: normalized, parentSignature };
    isSyncingFromExternal.current = true;
    setSelectedIds(new Set(normalized));
    setTimeout(() => { isSyncingFromExternal.current = false; }, 0);
  }, [selectedGenreIds, topLevelGenres]);

  // Notify parent of selection changes
  useEffect(() => {
    if (isSyncingFromExternal.current) return;
    onGenreSelectionChange(Array.from(selectedIds));
  }, [selectedIds]);

  // Notify parent of operator/selection for AND filtering.
  // Units are [[id], [id], ...] so App.tsx's every(unit => unit.some(...)) reduces to every(id => ...).
  useEffect(() => {
    const units = operator === 'and'
      ? Array.from(selectedIds).map((id) => [id])
      : [];
    onOperatorChange?.(operator, units);
  }, [operator, selectedIds]);

  // Selected genres for the summary section at the top of the list
  const selectedList = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => genreById.get(id))
        .filter((g): g is Genre => g !== undefined),
    [selectedIds, genreById]
  );

  if (graphType !== "artists") return null;

  const triggerLabel =
    totalSelected === 1
      ? (genreById.get(Array.from(selectedIds)[0])?.name ?? "Genres")
      : "Genres";

  return (
    <ResponsivePanel
      onOpenChange={(open) => {
        if (open) listRef.current?.scrollTo({ top: 0 });
      }}
      trigger={
        <Button size="lg" variant="outline" className={totalSelected > 0 ? "px-4" : ""}>
          {triggerLabel}
          {totalSelected > 0 ? (
            <Button asChild size="icon" variant="secondary" className="-m-1 w-6 h-6 group">
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear all genre filters"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); clearAll(); }}
              >
                {totalSelected > 1 ? (
                  <>
                    <span className="group-hover:opacity-0 group-hover:scale-0 transition-all text-xs leading-none">
                      {totalSelected}
                    </span>
                    <X className="transition-all group-hover:opacity-100 absolute scale-0 group-hover:scale-100 opacity-0 h-4 w-4 group-hover:-rotate-90" />
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
      <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
        <CommandInput placeholder="Filter genres..." value={query} onValueChange={setQuery} />
        {/* Operator toggle */}
        <div className="flex items-center gap-1 px-3 py-4 border-b text-sm" role="group" aria-label="Genre filter operator">
          <span className="text-muted-foreground">
            Match
            <Button
              variant="link"
              size="sm"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); setOperator('and'); }}
              className={cn("-mx-1.5", operator === 'or' ? "text-foreground underline" : "hidden")}
            >
              any
            </Button>
            <Button
              variant="link"
              size="sm"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); setOperator('or'); }}
              className={cn("-mx-1.5", operator === 'and' ? "text-foreground underline" : "hidden")}
            >
              all
            </Button>
            selected genres
          </span>
        </div>
        <CommandList ref={listRef}>
          <CommandEmpty>No genres found.</CommandEmpty>
          {/* Selected summary section */}
          {selectedList.length > 0 && (
            <CommandGroup className="bg-accent/40 border-b">
              {selectedList.map((genre) => (
                <CommandItem
                  key={`sel-${genre.id}`}
                  value={`selected:${genre.id} ${genre.name}`}
                  onSelect={() => toggleId(genre.id)}
                  className="flex items-center gap-2"
                >
                  <Check className="opacity-100" />
                  <BadgeIndicator type="genre" name={genre.name} color={genreColorMap?.get(genre.id)} />
                  <span>{genre.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {/* One section per parent genre */}
          {topLevelGenres.map((parent) => {
            const children = parentChildMap.get(parent.id) || [];
            const sectionState = getSectionState(parent);
            const parentChecked = selectedIds.has(parent.id);
            return (
              <CommandGroup key={parent.id}>
                {/* Section label + select-all / clear.
                    Rendered as a plain div so it's hidden by cmdk when the group has no matching items. */}
                <div className="flex items-center justify-between px-2 pt-2 pb-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {parent.name}
                  </span>
                  {sectionState === 'none' ? (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => { e.stopPropagation(); selectAllSection(parent); }}
                    >
                      all
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => { e.stopPropagation(); clearSection(parent); }}
                    >
                      clear
                    </button>
                  )}
                </div>
                {/* Parent genre as a selectable item within its own section */}
                <CommandItem
                  value={`${parent.id} ${parent.name}`}
                  onSelect={() => toggleId(parent.id)}
                  className="flex items-center gap-2"
                >
                  <Check className={parentChecked ? "opacity-100" : "hidden"} />
                  <BadgeIndicator type="genre" name={parent.name} color={genreColorMap?.get(parent.id)} />
                  <span>{parent.name}</span>
                </CommandItem>
                {/* Child genres, indented */}
                {children.map((child) => {
                  const childChecked = selectedIds.has(child.id);
                  return (
                    <CommandItem
                      key={`${parent.id}-${child.id}`}
                      value={`${child.id} ${child.name} ${parent.name}`}
                      onSelect={() => toggleId(child.id)}
                      className="flex items-center gap-2"
                    >
                      <Check className={childChecked ? "opacity-100" : "hidden"} />
                      <BadgeIndicator type="genre" name={child.name} color={genreColorMap?.get(child.id)} />
                      <span>{child.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </ResponsivePanel>
  );
}
