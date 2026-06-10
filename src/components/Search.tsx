import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { BadgeIndicator } from "@/components/BadgeIndicator"
import { useRecentSelections, groupByTime } from "@/hooks/useRecentSelections"
import { X, Search as SearchIcon, CirclePlay, HandHeart, SunMoon, Sun, Moon } from "lucide-react"
import { motion } from "framer-motion";
import { isGenre } from "@/lib/utils"
import { Artist, BasicNode, Genre, GraphType } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useMediaQuery } from "react-responsive";
import useSearch from "@/hooks/useSearch";
import {SEARCH_DEBOUNCE_MS} from "@/constants";
import { Kbd } from "./ui/kbd"

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
  onArtistPlay?: (artist: Artist) => void;
  onGenrePlay?: (genre: Genre) => void;
  onArtistGoTo?: (artist: Artist) => void;
  onGenreGoTo?: (genre: Genre) => void;
  onArtistViewSimilar?: (artist: Artist) => void;
  onGenreViewSimilar?: (genre: Genre) => void;
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
  onArtistPlay,
  onGenrePlay,
  onArtistGoTo,
  onGenreGoTo,
  onArtistViewSimilar,
  onGenreViewSimilar,
}: SearchProps) {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  // const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [query, setQuery] = useState("");
  const [shiftHeld, setShiftHeld] = useState(false);
  const [cmdCtrlHeld, setCmdCtrlHeld] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const { recentSelections, addRecentSelection, removeRecentSelection } = useRecentSelections();
  const { searchResults, searchLoading, searchError } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  // True from first keystroke until results land: covers the debounce window
  // (inputValue ahead of query) and the in-flight request
  const searchPending = inputValue.trim() !== "" && (searchLoading || inputValue !== query);

  // Debouncing
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(inputValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  // Reset selected value when input changes to keep cmdk selection in sync
  useEffect(() => {
    setSelectedValue("");
  }, [inputValue]);

  // Track modifier key states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftHeld(true);
      }
      if (e.key === 'Meta' || e.key === 'Control') {
        setCmdCtrlHeld(true);
      }
      if (e.key === 'Alt') {
        setAltHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftHeld(false);
      }
      if (e.key === 'Meta' || e.key === 'Control') {
        setCmdCtrlHeld(false);
      }
      if (e.key === 'Alt') {
        setAltHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);


  // Local items (graph artists + genres) are substring-filtered; server results are already
  // matched by the backend (prefix/fuzzy), so they pass through as-is. Duplicate names within
  // a type collapse to the first occurrence — bands sharing a name aren't distinguishable here yet
  const filteredSearchableItems = useMemo(() => {
    const search = inputValue.trim().toLowerCase();
    const localMatches = search
      ? [...currentArtists, ...genres].filter((item) => item.name.toLowerCase().includes(search))
      : [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return [...localMatches, ...searchResults].filter((item) => {
      const nameKey = `${isGenre(item) ? 'genre' : 'artist'}:${item.name.toLowerCase()}`;
      if (seenIds.has(item.id) || seenNames.has(nameKey)) return false;
      seenIds.add(item.id);
      seenNames.add(nameKey);
      return true;
    });
  }, [genres, searchResults, currentArtists, inputValue]);

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

  // Position cursor at end of input when dialog opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const input = inputRef.current; 
          const length = input.value.length;
          input.setSelectionRange(length, length);
        } 
      });
    }
  }, [open]);

  const onItemSelect = (selection: BasicNode) => {
    if (isGenre(selection)) {
      onGenreSelect(selection as Genre);
    } else {
      onArtistSelect(selection as Artist);
    }
    addRecentSelection(selection, isGenre(selection) ? 'genre' : 'artist');
    setOpen(false);
  }
  // Checks which modifier keys are held and performs the appropriate action
  const handleItemAction = (item: BasicNode) => {
    const isGenreItem = isGenre(item);

    // Cmd/Ctrl + Click: Go To
    if (cmdCtrlHeld && !altHeld && !shiftHeld) {
      if (isGenreItem && onGenreGoTo) {
        onGenreGoTo(item as Genre);
      } else if (!isGenreItem && onArtistGoTo) {
        onArtistGoTo(item as Artist);
      }
      addRecentSelection(item, isGenre(item) ? 'genre' : 'artist');
      setOpen(false);
    }
    // Alt + Click: View Similar
    else if (altHeld && !cmdCtrlHeld && !shiftHeld) {
      if (isGenreItem && onGenreViewSimilar) {
        onGenreViewSimilar(item as Genre);
      } else if (!isGenreItem && onArtistViewSimilar) {
        onArtistViewSimilar(item as Artist);
      }
      addRecentSelection(item, isGenre(item) ? 'genre' : 'artist');
      setOpen(false);
    }
    // Shift + Click: Play
    else if (shiftHeld && !cmdCtrlHeld && !altHeld) {
      if (isGenreItem && onGenrePlay) {
        onGenrePlay(item as Genre);
      } else if (!isGenreItem && onArtistPlay) {
        onArtistPlay(item as Artist);
      }
      addRecentSelection(item, isGenre(item) ? 'genre' : 'artist');
      setOpen(false);
    }
    // No modifiers: Default select
    else {
      onItemSelect(item);
    }
  }

  const getActionHint = (item: BasicNode, isSelected: boolean) => {
    if (!isSelected) return null;

    const isGenreItem = isGenre(item);

    // Only show one hint at a time, prioritize in order: Cmd/Ctrl, Alt, Shift
    if (cmdCtrlHeld && !altHeld && !shiftHeld) {
      return isGenreItem ? `Go to ${item.name}` : 'Explore Related Genres';
    } else if (altHeld && !cmdCtrlHeld && !shiftHeld) {
      return 'View Similar';
    } else if (shiftHeld && !cmdCtrlHeld && !altHeld) {
      return `Play ${item.name}`;
    }

    return null;
  };

  const { theme, setTheme } = useTheme()

  // Define searchable actions
  const searchableActions = useMemo(() => [
    {
      id: 'feedback',
      label: 'Give Feedback',
      keywords: ['feedback', 'give', 'report', 'suggest'],
      icon: HandHeart,
      onSelect: () => { window.dispatchEvent(new Event('feedback:open')) }
    },
    {
      id: 'toggle-theme',
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      keywords: ['theme', 'dark', 'light', 'mode', 'switch', 'toggle', 'dark mode', 'light mode'],
      icon: theme === "dark" ? Sun : Moon,
      onSelect: () => { setTheme(theme === "light" ? "dark" : "light") }
    }
  ], [theme, setTheme]);

  // Filter actions based on input
  const filteredActions = useMemo(() => {
    if (!inputValue) return searchableActions;
    const searchLower = inputValue.toLowerCase();
    return searchableActions.filter(action =>
      action.label.toLowerCase().includes(searchLower) ||
      action.keywords.some(keyword => keyword.includes(searchLower))
    );
  }, [inputValue, searchableActions]);

  // Create a map for quick lookup of items by their value (id)
  const itemsById = useMemo(() => {
    const map = new Map<string, BasicNode>();
    recentSelections.forEach(item => map.set(item.id, item));
    filteredSearchableItems.forEach(item => map.set(item.id, item));
    return map;
  }, [recentSelections, filteredSearchableItems]);

  // Intercept keyboard events in capture phase before cmdk processes them
  const handleKeyDownCapture = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;

    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    const isAlt = e.altKey;
    const isShift = e.shiftKey;

    // Only handle modified Enter keys
    if (!isCmdOrCtrl && !isAlt && !isShift) return;

    // Prevent cmdk from handling this event
    e.preventDefault();
    e.stopPropagation();

    // Find the currently selected item in the DOM (cmdk adds data-selected="true")
    const selectedElement = document.querySelector('[cmdk-item][data-selected="true"]');
    if (!selectedElement) return;

    // Get the value attribute (which is the item ID)
    const selectedValue = selectedElement.getAttribute('data-value');
    if (!selectedValue) return;

    // Look up the item by ID
    const selectedItem = itemsById.get(selectedValue);
    if (!selectedItem) return;

    const isGenreItem = isGenre(selectedItem);

    // Cmd/Ctrl + Enter: Go To
    if (isCmdOrCtrl && !isAlt && !isShift) {
      if (isGenreItem && onGenreGoTo) {
        onGenreGoTo(selectedItem as Genre);
      } else if (!isGenreItem && onArtistGoTo) {
        onArtistGoTo(selectedItem as Artist);
      }
      addRecentSelection(selectedItem, isGenre(selectedItem) ? 'genre' : 'artist');
      setOpen(false);
    }
    // Alt + Enter: View Similar
    else if (isAlt && !isCmdOrCtrl && !isShift) {
      if (isGenreItem && onGenreViewSimilar) {
        onGenreViewSimilar(selectedItem as Genre);
      } else if (!isGenreItem && onArtistViewSimilar) {
        onArtistViewSimilar(selectedItem as Artist);
      }
      addRecentSelection(selectedItem, isGenre(selectedItem) ? 'genre' : 'artist');
      setOpen(false);
    }
    // Shift + Enter: Play
    else if (isShift && !isCmdOrCtrl && !isAlt) {
      if (isGenreItem && onGenrePlay) {
        onGenrePlay(selectedItem as Genre);
      } else if (!isGenreItem && onArtistPlay) {
        onArtistPlay(selectedItem as Artist);
      }
      addRecentSelection(selectedItem, isGenre(selectedItem) ? 'genre' : 'artist');
      setOpen(false);
    }
  };

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
          open={open}
          onOpenChange={setOpen}
          shouldFilter={false}
          value={selectedValue}
          onValueChange={setSelectedValue}
          className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[600px] sm:max-w-xl md:max-w-xl lg:max-w-3xl w-full"
      >
        <div onKeyDownCapture={handleKeyDownCapture} className="flex flex-col h-full">
        <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
            ref={inputRef}
        />
        <CommandList className="max-h-none flex-1 overflow-y-auto">
          {searchPending && filteredSearchableItems.length === 0 && (
              <CommandGroup heading="Search Results">
                {["w-40", "w-28", "w-36", "w-24", "w-32"].map((width, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <Skeleton className="bg-accent size-6 flex-shrink-0 rounded-full" />
                      <Skeleton className={`bg-accent h-6 ${width}`} />
                    </div>
                    <Skeleton className="bg-accent h-6 w-12 rounded-sm" />
                  </div>
                ))}
              </CommandGroup>
          )}
          {!searchPending && <CommandEmpty>{inputValue ? "No results found." : "Start typing to search..."}</CommandEmpty>}
          {inputValue.trim() !== "" && filteredSearchableItems.length > 0 && (
              <CommandGroup heading="Search Results">
                {filteredSearchableItems.map((item, i) => {
                  const meta = getIndicatorMeta(item);
                  const isGenreItem = meta.type === 'genre';

                  return (
                    <CommandItem
                        key={`${item.id}-${i}`}
                        value={item.id}
                        onSelect={() => handleItemAction(item)}
                        className="flex items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {shiftHeld && selectedValue === item.id ? (
                          <CirclePlay className="size-4 flex-shrink-0" />
                        ) : (
                          <BadgeIndicator
                            type={meta.type}
                            name={item.name}
                            color={meta.color}
                            imageUrl={meta.imageUrl}
                            className={cn('flex-shrink-0', isGenreItem ? 'size-2' : undefined)}
                          />
                        )}
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getActionHint(item, selectedValue === item.id) && (
                          <span className="text-xs text-muted-foreground">
                            {getActionHint(item, selectedValue === item.id)}
                          </span>
                        )}
                        <Badge variant="secondary">{meta.type}</Badge>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
          )}

          {!inputValue && recentSelections.length > 0 && groupByTime(recentSelections).map((bucket) => (
              <CommandGroup key={bucket.label} heading={bucket.label}>
                {bucket.items.map((selection) => {
                  const meta = getIndicatorMeta(selection);
                  const isGenreSelection = meta.type === 'genre';
                  return (
                    <CommandItem
                      key={selection.id}
                      value={selection.id}
                      onSelect={() => handleItemAction(selection)}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {shiftHeld && selectedValue === selection.id ? (
                          <CirclePlay className="size-4 flex-shrink-0" />
                        ) : (
                          <div className={`flex items-center ${isGenreSelection ? 'p-1.5' : ''}`}>
                            <BadgeIndicator
                              type={meta.type}
                              name={selection.name}
                              color={meta.color}
                              imageUrl={meta.imageUrl}
                              className={cn('flex-shrink-0', isGenreSelection ? 'size-2' : undefined)}
                            />
                          </div>
                        )}
                        <span className="truncate">{selection.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getActionHint(selection, selectedValue === selection.id) && (
                          <span className="text-xs text-muted-foreground">
                            {getActionHint(selection, selectedValue === selection.id)}
                          </span>
                        )}
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
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          {filteredActions.length > 0 && (
          <CommandGroup heading="Actions">
            {filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.id}
                  onSelect={action.onSelect}
                >
                  <Icon className="mr-2 size-4" />
                  {action.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          )}
       
        </CommandList>
        {/* Shortcut Legend */}
        {!isMobile && <div className="w-full justify-end p-3 flex gap-3 bg-background border-t">
            <span className="text-xs font-medium text-muted-foreground">Preview <Kbd>⏎</Kbd>
            </span>
            <span className="text-xs font-medium text-muted-foreground">Go To / Explore Related Genres <Kbd>⌘⏎</Kbd>
            </span>
            <span className="text-xs font-medium text-muted-foreground">View Similar <Kbd>⌥⏎</Kbd>
            </span>
            <span className="text-xs font-medium text-muted-foreground">Play <Kbd>⇧⏎</Kbd>
            </span>

        </div>}
        </div>
      </CommandDialog>
    </>
  )
}
