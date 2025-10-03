import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { BadgeIndicator } from "@/components/BadgeIndicator"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { X, Search as SearchIcon } from "lucide-react"
import { motion } from "framer-motion";
import { isGenre } from "@/lib/utils"
import { Artist, BasicNode, Genre, GraphType } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loading } from "@/components/Loading";
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useMediaQuery } from "react-responsive";
import useSearch from "@/hooks/useSearch";
import {SEARCH_DEBOUNCE_MS} from "@/constants";

interface SearchProps {
  onGenreSelect: (genre: Genre) => void;
  onArtistSelect: (artist: Artist) => void;
  graphState: GraphType;
  currentArtists: Artist[];
  genres?: Genre[];
  selectedGenres?: Genre[];
  selectedArtist?: Artist;
  open: boolean;
  setOpen: (open: boolean) => void;
  genreColorMap?: Map<string, string>;
  getArtistColor?: (artist: Artist) => string;
}

export function Search({
  onGenreSelect,
  onArtistSelect,
  currentArtists,
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
  const [activeCategory, setActiveCategory] = useState<"recents" | "artists" | "genres">("recents");
  const { recentSelections, addRecentSelection, removeRecentSelection } = useRecentSelections();
  const { searchResults, searchLoading, searchError } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

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


  // Filter the searchable items. This is problematic with bands of the same name, for now it just uses the first one in the results
  const filteredSearchableItems = useMemo(() => {
    const seenNames = new Set<string>();
    return [...currentArtists, ...searchResults, ...genres].filter((item) => {
      if (!item.name.toLowerCase().includes(inputValue.toLowerCase())) return false;
      if (seenNames.has(item.name)) return false;
      seenNames.add(item.name);
      return true;
    }
    )},
      [genres, searchResults, currentArtists, inputValue]
  );

  const categoryConfigurations = useMemo(() => {
    const configs = [
      {
        key: "recents" as const,
        label: "Recents",
        items: recentSelections,
      },
      {
        key: "artists" as const,
        label: "Artists",
        items: currentArtists,
      },
      {
        key: "genres" as const,
        label: "Genres",
        items: genres,
      },
    ];

    return configs.filter((config) => {
      if (config.key === "recents") {
        return true;
      }
      return config.items.length > 0;
    });
  }, [currentArtists, genres, recentSelections]);

  useEffect(() => {
    if (categoryConfigurations.some((config) => config.key === activeCategory)) {
      return;
    }

    const fallback = categoryConfigurations[0]?.key ?? "recents";
    setActiveCategory(fallback);
  }, [activeCategory, categoryConfigurations]);

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

  const showSearchResults = inputValue.trim().length > 0;
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
          className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[600px] max-w-lg sm:max-w-xl md:max-w-xl lg:max-w-3xl w-full"
      >
        <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
            ref={inputRef}
        />
        <CommandList className={cn("max-h-none flex-1", showSearchResults ? "overflow-y-auto" : "overflow-hidden")}
        >
          {searchLoading && <Loading />}
          <CommandEmpty>
            {showSearchResults
              ? "No results found."
              : activeCategoryConfig
                ? `No ${activeCategoryConfig.label.toLowerCase()} yet.`
                : "Nothing to show yet."}
          </CommandEmpty>
          {showSearchResults ? (
            <>
              <CommandGroup heading="All Results">
                {filteredSearchableItems.map((item, i) => {
                  const meta = getIndicatorMeta(item);
                  const isGenreItem = meta.type === 'genre';

                  return (
                    <CommandItem
                      key={`${item.id}-${i}`}
                      onSelect={() => onItemSelect(item)}
                      className="flex items-center justify-between gap-2"
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
                })}
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
            <div className="flex h-full min-h-[300px]">
              <div className="w-40 shrink-0 border-r border-border bg-muted/10">
                <div className="flex flex-col gap-1 p-3">
                  {categoryConfigurations.map((config) => (
                    <button
                      key={config.key}
                      type="button"
                      className={cn(
                        "rounded-md px-2 py-2 text-left text-sm font-medium transition-colors",
                        activeCategory === config.key
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setActiveCategory(config.key)}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {activeCategoryConfig && (
                  <CommandGroup heading={activeCategoryConfig.label} className="px-0">
                    {activeCategoryConfig.items.map((item) => {
                      const meta = getIndicatorMeta(item);
                      const isGenreSelection = meta.type === 'genre';
                      const isRecentCategory = activeCategoryConfig.key === 'recents';

                      return (
                        <CommandItem
                          key={item.id}
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
                    })}
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
