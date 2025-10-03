import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { BadgeIndicator } from "@/components/BadgeIndicator"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { X, Search as SearchIcon } from "lucide-react"
import { motion } from "framer-motion";
import { isGenre } from "@/lib/utils"
import { Artist, BasicNode, Genre, GraphType } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useMemo } from "react";
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
  const { recentSelections, addRecentSelection, removeRecentSelection } = useRecentSelections();
  const { searchResults, searchLoading, searchError } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debouncing
  useEffect(() => {
    if (inputValue) {
      const timeout = setTimeout(() => {
        setQuery(inputValue);
      }, SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(timeout);
    }
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
      [genres, searchResults, currentArtists]
  );

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
        <CommandList>
          {searchLoading && <Loading />}
          <CommandEmpty>{inputValue ? "No results found." : "Start typing to search..."}</CommandEmpty>
          {recentSelections.length > 0 && (
            <CommandGroup heading="Recent Selections">
              {recentSelections.map((selection) => {
                const meta = getIndicatorMeta(selection);
                const isGenreSelection = meta.type === 'genre';

                return (
                  <CommandItem
                    key={selection.id}
                    onSelect={() => onItemSelect(selection)}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className={`flex items-center ${isGenreSelection ? 'p-1.5' : ''}`}>
                        <BadgeIndicator
                          type={meta.type}
                          name={selection.name}
                          color={meta.color}
                          imageUrl={meta.imageUrl}
                          className={cn('flex-shrink-0', isGenreSelection ? 'size-2' : undefined)}
                        />
                      </div>
                      <span className="truncate">{selection.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSelection(selection.id);
                      }}
                      className="-m-2"
                    >
                      <X />
                    </Button>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
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
          {recentSelections.length > 0 && <CommandSeparator />}
          {inputValue && (
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
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
