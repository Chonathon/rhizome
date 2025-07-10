import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useRecentSelections } from "@/hooks/useRecentSelections"
import { X, Search as SearchIcon } from "lucide-react"
import { motion } from "framer-motion";
import {isGenre} from "@/lib/utils"
import {Artist, BasicNode, Genre, GraphType} from "@/types";
import {useEffect, useRef, useState} from "react";
import { useMemo } from "react";
import {Loading} from "@/components/Loading";
import useMBArtistSearch from "@/hooks/useMBArtistSearch";

interface SearchProps {
  onGenreSelect: (genre: string) => void;
  onArtistSelect: (artist: Artist) => void;
  graphState: GraphType;
  currentArtists: Artist[];
  genres: Genre[];
}

const DEBOUNCE_MS = 500;

export function Search({ onGenreSelect, onArtistSelect, currentArtists, genres }: SearchProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [query, setQuery] = useState("");
  const { recentSelections, addRecentSelection, removeRecentSelection } = useRecentSelections();
  const { mbSearchResults, mbSearchLoading, mbSearchError } = useMBArtistSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debouncing
  useEffect(() => {
    if (inputValue) {
      const timeout = setTimeout(() => {
        setQuery(inputValue);
      }, DEBOUNCE_MS);
      return () => clearTimeout(timeout);
    }
  }, [inputValue, DEBOUNCE_MS]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Filter the searchable items. This is problematic with bands of the same name, for now it just uses the first one in the results
  const filteredSearchableItems = useMemo(() => {
    const seenNames = new Set<string>();
    return [...currentArtists, ...mbSearchResults, ...genres].filter((item) => {
      if (!item.name.toLowerCase().includes(inputValue.toLowerCase())) return false;
      if (seenNames.has(item.name)) return false;
      seenNames.add(item.name);
      return true;
    }
    )},
      [genres, mbSearchResults, currentArtists]
  );

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
      onGenreSelect(selection.name);
    } else {
      onArtistSelect(selection as Artist);
    }
    addRecentSelection(selection);
    setOpen(false);
  }

  return (
    <>
      <motion.div
      layout
      >
        <Button
          variant="outline"
          aria-label="Search"
          className=
            "w- h-[54px] bg-gray-100/90 hover:bg-gray-200/90 backdrop-blur-xs shadow-md rounded-full justify-between text-left text-md font-normal text-muted-foreground"

          onClick={() => setOpen(true)}
        >
          <div className="flex gap-2 items-center">
            <SearchIcon size={20}></SearchIcon>
            <span className="text-sm text-muted-foreground">⌘K</span>
          </div>
          {/* <Badge
          className="text-xs text-muted-foreground"
          variant="outline"
          >⌘K
          </Badge> */}
        </Button>
      </motion.div>
      <CommandDialog
          key={filteredSearchableItems.length
              ? filteredSearchableItems[filteredSearchableItems.length - 1].name
              : filteredSearchableItems.length}
          open={open}
          onOpenChange={setOpen}
      >
        <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
            ref={inputRef}
        />
        <CommandList>
          {mbSearchLoading && <Loading />}
          <CommandEmpty>{inputValue ? "No results found." : "Start typing to search..."}</CommandEmpty>
          {recentSelections.length > 0 && (
            <CommandGroup heading="Recent Selections">
              {recentSelections.map((selection) => (
                <CommandItem
                  key={selection.id}
                  onSelect={() => onItemSelect(selection)}
                  className="flex items-center justify-between"
                >
                  <span>{selection.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSelection(selection.id);
                    }}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {recentSelections.length > 0 && <CommandSeparator />}
          {inputValue && (
              <CommandGroup heading="All Results">
                {filteredSearchableItems.map((item, i) => (
                    <CommandItem
                        key={`${item.id}-${i}`}
                        onSelect={() => onItemSelect(item)}
                        className="flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <Badge variant="secondary">{isGenre(item) ? 'genre' : 'artist'}</Badge>
                    </CommandItem>
                ))}
              </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}