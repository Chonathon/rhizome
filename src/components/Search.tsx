import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { BadgeIndicator } from "@/components/BadgeIndicator"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { X, Search as SearchIcon } from "lucide-react"
import { motion } from "framer-motion";
import { isGenre } from "@/lib/utils"
import { Artist, BasicNode, Genre, GraphType } from "@/types";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useMediaQuery } from "react-responsive";
import useSearch from "@/hooks/useSearch";
import {SEARCH_DEBOUNCE_MS} from "@/constants";

const SEARCH_PAGE_SIZE = 50;
const SEARCH_PREFETCH_THRESHOLD = 10;

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
        <Skeleton className="h-4 w-[40%] max-w-[220px]" />
      </div>
      <Skeleton className="h-5 w-14 rounded" />
    </div>
  );
}

function SkeletonList({ count = 8 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}</>;
}

interface SearchProps {
  onGenreSelect: (genre: Genre) => void;
  onArtistSelect: (artist: Artist) => void;
  graphState: GraphType;
  currentArtists: Artist[];
  availableArtists?: Artist[];
  genres?: Genre[];
  selectedGenres?: Genre[];
  selectedArtist?: Artist;
  open: boolean;
  setOpen: (open: boolean) => void;
  genreColorMap?: Map<string, string>;
  getArtistColor?: (artist: Artist) => string;
}

type CategoryKey = 'recents' | 'artists' | 'genres' | 'decade' | 'moodActivity';

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  items: BasicNode[];
  emptyMessage: string;
}

export function Search({
  onGenreSelect,
  onArtistSelect,
  currentArtists,
  availableArtists,
  genres = [],
  selectedGenres,
  selectedArtist,
  open,
  setOpen,
  genreColorMap,
  getArtistColor,
}: SearchProps) {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  // const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("recents");
  const [pendingCategoryKey, setPendingCategoryKey] = useState<CategoryKey | null>(null);
  const [, startCategoryTransition] = useTransition();
  const [visibleResultCount, setVisibleResultCount] = useState(SEARCH_PAGE_SIZE);
  const { recentSelections, addRecentSelection, removeRecentSelection } = useRecentSelections();
  const { searchResults, searchLoading, searchError } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const rawSearchTerm = inputValue.trim().toLowerCase();
  const deferredSearchTerm = useDeferredValue(rawSearchTerm);
  const isFiltering = rawSearchTerm !== deferredSearchTerm;

  const resolvedArtists = useMemo(() => {
    if (!availableArtists?.length) {
      return currentArtists;
    }

    if (!currentArtists.length) {
      return availableArtists;
    }

    const byId = new Map<string, Artist>();
    [...availableArtists, ...currentArtists].forEach((artist) => {
      if (!byId.has(artist.id)) {
        byId.set(artist.id, artist);
      }
    });

    return Array.from(byId.values());
  }, [availableArtists, currentArtists]);

  // Debouncing
  useEffect(() => {
    if (!inputValue) {
      setQuery("");
      return;
    }

    const timeout = setTimeout(() => {
      setQuery(inputValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [inputValue, SEARCH_DEBOUNCE_MS]);

  useEffect(() => {
    setVisibleResultCount(SEARCH_PAGE_SIZE);
  }, [rawSearchTerm]);


  // Filter the searchable items only when a term is present, deduping by display name
  const filteredSearchableItems = useMemo(() => {
    if (!deferredSearchTerm) {
      return [];
    }

    const seenNames = new Set<string>();
    const results: BasicNode[] = [];

    const matchAndPush = (item: BasicNode) => {
      const normalized = item.name.toLowerCase();
      if (!normalized.includes(deferredSearchTerm)) {
        return;
      }
      if (seenNames.has(item.name)) {
        return;
      }
      seenNames.add(item.name);
      results.push(item);
    };

    resolvedArtists.forEach(matchAndPush);
    searchResults.forEach(matchAndPush);
    genres.forEach(matchAndPush);

    return results;
  }, [deferredSearchTerm, genres, searchResults, resolvedArtists]);

  const totalResultCount = filteredSearchableItems.length;

  const visibleSearchResults = useMemo(() => {
    if (visibleResultCount >= totalResultCount) {
      return filteredSearchableItems;
    }

    return filteredSearchableItems.slice(0, visibleResultCount);
  }, [filteredSearchableItems, visibleResultCount, totalResultCount]);

  const categoryConfigurations = useMemo<CategoryConfig[]>(() => {
    return [
      {
        key: "recents",
        label: "Recents",
        items: recentSelections,
        emptyMessage: "No recent searches yet.",
      },
      {
        key: "artists",
        label: "Artists",
        items: resolvedArtists,
        emptyMessage: "No artists available yet.",
      },
      {
        key: "genres",
        label: "Genres",
        items: genres,
        emptyMessage: "No genres available yet.",
      },
      {
        key: "decade",
        label: "Decade",
        items: [],
        emptyMessage: "Decade filters coming soon.",
      },
      {
        key: "moodActivity",
        label: "Mood & Activity",
        items: [],
        emptyMessage: "Mood & activity filters coming soon.",
      },
    ];
  }, [resolvedArtists, genres, recentSelections]);

  useEffect(() => {
    if (categoryConfigurations.some((config) => config.key === activeCategory)) {
      return;
    }

    const fallback = categoryConfigurations[0]?.key ?? "recents";
    setPendingCategoryKey(null);
    setActiveCategory(fallback);
  }, [activeCategory, categoryConfigurations]);

  useEffect(() => {
    if (pendingCategoryKey !== null && !categoryConfigurations.some((config) => config.key === pendingCategoryKey)) {
      setPendingCategoryKey(null);
    }
  }, [pendingCategoryKey, categoryConfigurations]);

  useEffect(() => {
    if (pendingCategoryKey !== null && activeCategory === pendingCategoryKey) {
      setPendingCategoryKey(null);
    }
  }, [activeCategory, pendingCategoryKey]);

  const handleCategorySelect = useCallback((key: CategoryKey) => {
    if (key === activeCategory && pendingCategoryKey === null) {
      return;
    }

    if (key === pendingCategoryKey) {
      return;
    }

    setPendingCategoryKey(key);
    startCategoryTransition(() => {
      setActiveCategory(key);
    });
  }, [activeCategory, pendingCategoryKey, startCategoryTransition]);

  const highlightedCategoryKey = pendingCategoryKey ?? activeCategory;

  const showSearchResults = rawSearchTerm.length > 0;

  const handleResultPrefetch = useCallback((index: number) => {
    if (!showSearchResults) {
      return;
    }

    if (index < visibleResultCount - SEARCH_PREFETCH_THRESHOLD) {
      return;
    }

    setVisibleResultCount((prev) => {
      if (prev >= totalResultCount) {
        return prev;
      }

      const next = prev + SEARCH_PAGE_SIZE;
      return Math.min(next, totalResultCount);
    });
  }, [showSearchResults, totalResultCount, visibleResultCount]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || showSearchResults) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest("[data-slot='command']")) {
        return;
      }

      const configs = categoryConfigurations;
      if (configs.length === 0) {
        return;
      }

      const currentIndex = configs.findIndex((config) => config.key === activeCategory);
      if (currentIndex === -1) {
        return;
      }

      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + configs.length) % configs.length
        : (currentIndex + 1) % configs.length;

      if (nextIndex === currentIndex) {
        return;
      }

      event.preventDefault();
      const nextKey = configs[nextIndex].key;
      handleCategorySelect(nextKey);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, showSearchResults, categoryConfigurations, handleCategorySelect]);

  const isArtistWithDetail = (node: BasicNode): node is Artist => {
    return 'tags' in node && Array.isArray((node as Artist).tags);
  };

  const getIndicatorMeta = (item: BasicNode) => {
    if (isGenre(item)) {
      return {
        type: 'genre' as const,
        color: genreColorMap?.get(item.id),
        imageUrl: undefined,
      };
    }

    const maybeArtist = item as Partial<Artist>;
    const image = typeof maybeArtist.image === 'string' && maybeArtist.image.trim().length > 0
      ? maybeArtist.image
      : undefined;
    const color = getArtistColor && isArtistWithDetail(item) ? getArtistColor(item) : undefined;

    return {
      type: 'artist' as const,
      color,
      imageUrl: image,
    };
  };

  // Clears the selection on remount
  useEffect(() => {
    if (open) {
      // Wait for next tick after remount and selection
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const input = inputRef.current; 
          const length = input.value.length;
          input.setSelectionRange(length, length);
        } 
      });
    }
  }, [open, filteredSearchableItems.length]);

  const onItemSelect = (selection: BasicNode) => {
    if (isGenre(selection)) {
      onGenreSelect(selection as Genre);
    } else {
      onArtistSelect(selection as Artist);
    }
    addRecentSelection(selection);
    setOpen(false);
  }

  const { theme, setTheme } = useTheme()

  const activeCategoryConfig = categoryConfigurations.find((config) => config.key === activeCategory);

  return (
    <>
      <motion.div
      layout
      >
        <Button
          variant="outline"
          aria-label="Search"
          className={`w-full bg-background/90 hover:bg-accent/90 backdrop-blur-xs shadow-md rounded-full justify-between text-left text-md font-normal text-foreground h-[54px]
            ${isMobile ? "w-full" : "hidden"}`}
          onClick={() => setOpen(true)}
        >
          <div className="flex gap-2 items-center animate-fade-in min-w-0">
            <SearchIcon size={20}></SearchIcon>
            {selectedGenres?.length ? (
              <span className="truncate">{selectedGenres[0].name}</span>
            ) : selectedArtist ? (
              <span className="truncate">{selectedArtist.name}</span>
            ) : (
              <div className="flex text-muted-foreground items-center gap-2">
                Search
              {isMobile ? 
                "" : <Badge
                className="text-xs text-muted-foreground flex-shrink-0"
                variant="outline"
                >⌘K
                </Badge>}
              </div>
            )}
          </div>
        </Button>
      </motion.div>
      <CommandDialog
          key={filteredSearchableItems.length
            ? filteredSearchableItems[filteredSearchableItems.length - 1].id
            : filteredSearchableItems.length}
          open={open}
          onOpenChange={setOpen}
          className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[600px] sm:max-w-xl md:max-w-xl lg:max-w-3xl w-full min-h-0"
          commandProps={{
            className: cn(
              "h-full min-h-0 grid grid-rows-[auto_minmax(0,1fr)]",
              "[&_[data-slot=command-input-wrapper]]:shadow-none",
              "[&_[data-slot=command-input-wrapper]]:focus-within:shadow-none",
              "[&_[data-slot=command-input-wrapper]]:focus-within:ring-0",
              "[&_[data-slot=command-input-wrapper]]:focus-within:outline-none",
              "[&_[data-slot=command-input]]:focus:outline-none",
              "[&_[data-slot=command-input]]:focus:ring-0",
              "[&_[data-slot=command-input]]:focus:shadow-none",
              "[&_[data-slot=command-input]]:focus-visible:outline-none",
              "[&_[data-slot=command-input]]:focus-visible:ring-0"
            )
          }}
      >
        <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
            ref={inputRef}
        />
        <CommandList
          className={cn(
            "max-h-none min-h-0 overflow-y-auto no-scrollbar"
          )}
        >
          <CommandEmpty>
            {showSearchResults
              ? "No results found."
              : activeCategoryConfig?.emptyMessage ?? "Nothing to show yet."}
          </CommandEmpty>
          {showSearchResults ? (
            <>
              <CommandGroup heading="All Results">
                {searchLoading || isFiltering ? (
                  <SkeletonList />
                ) : (
                  visibleSearchResults.map((item, i) => {
                    const meta = getIndicatorMeta(item);
                    const isGenreItem = meta.type === 'genre';

                    return (
                      <CommandItem
                        key={`${item.id}-${i}`}
                        value={`${item.name}::${item.id}`}
                        onSelect={() => onItemSelect(item)}
                        className="flex items-center justify-between gap-2"
                        onFocus={() => handleResultPrefetch(i)}
                        onPointerEnter={() => handleResultPrefetch(i)}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <BadgeIndicator
                            type={meta.type}
                            name={item.name}
                            color={meta.color}
                            imageUrl={meta.imageUrl}
                            className={cn('flex-shrink-0', isGenreItem ? 'size-2' : undefined)}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <Badge variant="secondary">{meta.type}</Badge>
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
              <CommandGroup heading="Actions">
                <CommandItem
                  key={"toggle-theme"}
                  onSelect={() => {
                    setTheme(theme === "light" ? "dark" : "light");
                  }}
                  className="flex items-center justify-between"
                >
                  {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </CommandItem>
              </CommandGroup>
            </>
          ) : (
            <div className="flex h-full min-h-0 flex-col sm:flex-row">
              <div
                className={cn(
                  "flex bg-background",
                  "sm:sticky sm:top-0 sm:mx-0 sm:h-full sm:w-40 sm:flex-col sm:self-start  sm:bg-transparent sm:px-0 sm:pb-0"
                )}
              >
                <div className="flex px-2 gap-2 overflow-x-auto py-2 sm:flex-1 sm:flex-col no-scrollbar sm:gap-1 sm:overflow-visible sm:p-3">
                  {categoryConfigurations.map((config) => (
                    <button
                      key={config.key}
                      type="button"
                      className={cn(
                        "flex-shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap",
                        "sm:w-full",
                        highlightedCategoryKey === config.key
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleCategorySelect(config.key)}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto sm:p-3">
                {activeCategoryConfig && (
                  <CommandGroup heading={activeCategoryConfig.label} className="px-0">
                    {activeCategoryConfig.items.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        {activeCategoryConfig.emptyMessage}
                      </div>
                    ) : (
                      activeCategoryConfig.items.map((item) => {
                        const meta = getIndicatorMeta(item);
                        const isGenreSelection = meta.type === 'genre';
                        const isRecentCategory = activeCategoryConfig.key === 'recents';

                        return (
                          <CommandItem
                            key={item.id}
                            value={`${item.name}::${item.id}`}
                            onSelect={() => onItemSelect(item)}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <div className={cn("flex items-center", isGenreSelection ? 'p-1.5' : undefined)}>
                                <BadgeIndicator
                                  type={meta.type}
                                  name={item.name}
                                  color={meta.color}
                                  imageUrl={meta.imageUrl}
                                  className={cn('flex-shrink-0', isGenreSelection ? 'size-2' : undefined)}
                                />
                              </div>
                              <span className="truncate">{item.name}</span>
                            </div>
                            {isRecentCategory ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecentSelection(item.id);
                                }}
                                className="-m-2"
                              >
                                <X />
                              </Button>
                            ) : (
                              <Badge variant="secondary">{meta.type}</Badge>
                            )}
                          </CommandItem>
                        );
                      })
                    )}
                  </CommandGroup>
                )}
                <CommandGroup heading="Actions" className="px-0">
                  <CommandItem
                    key={"toggle-theme"}
                    onSelect={() => {
                      setTheme(theme === "light" ? "dark" : "light");
                    }}
                    className="flex items-center justify-between"
                  >
                    {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  </CommandItem>
                </CommandGroup>
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
