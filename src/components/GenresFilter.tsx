import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { Genre, GenreClusterMode, GraphType } from "@/types";
import { isTopLevelGenre } from "@/lib/utils";
import { Collapsible, 
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
  const topLevelGenres = useMemo(
    () => genres.filter((g) => isTopLevelGenre(g, genreClusterMode)),
    [genres, genreClusterMode]
  );

  const [checked, setChecked] = useState<boolean[]>([]);
  const [query, setQuery] = useState<string>("");

  // Keep the `checked` array length in sync with top-level genre count
  useEffect(() => {
    const count = topLevelGenres.length;
    setChecked((prev) => {
      if (prev.length === count) return prev;
      return Array(count).fill(false);
    });
  }, [topLevelGenres]);

  const filtered = useMemo(() => {
    if (!query) return topLevelGenres;
    const q = query.toLowerCase();
    return topLevelGenres.filter((g) => g.name.toLowerCase().includes(q));
  }, [query, topLevelGenres]);

  const toggleGenre = (genre: Genre) => {
    const index = topLevelGenres.findIndex((g) => g.id === genre.id);
    if (index < 0) return;
    const nextSelected = !checked[index];
    setChecked((prev) => prev.map((c, i) => (i === index ? !c : c)));
    if (nextSelected) {
      onParentSelect(genre);
    } else {
      onParentDeselect(genre);
    }
  };

  const totalSelected = checked.filter(Boolean).length;

  const getChildGenres = (parent: Genre) => {
  return [
    { id: `${parent.id}-child-a`, name: `death ${parent.name}` } as Genre,
    { id: `${parent.id}-child-b`, name: `post ${parent.name}` } as Genre,
    { id: `${parent.id}-child-c`, name: `industrial ${parent.name}` } as Genre,
    { id: `${parent.id}-child-d`, name: `black ${parent.name}` } as Genre,
  ];
};

  return graphType !== "artists" ? null : (
    <ResponsivePanel
      trigger={
        
          <Button size='lg' variant='outline'>{`Genres (${totalSelected})`}
            <ChevronDown />
          </Button>
      }
      className="p-0 overflow-hidden"
      side="bottom"
    >
      <Command>
        <CommandInput
          placeholder="Filter genres..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No genres found.</CommandEmpty>
          <CommandGroup heading="Genres">
            {filtered.map((genre) => {
              const index = topLevelGenres.findIndex((g) => g.id === genre.id);
              const isSelected = index >= 0 ? checked[index] : false;
              return (
                <Collapsible
                    key={genre.id}
                    >
                  <div className="flex w-full items-center justify-between">
                    <CommandItem
                    className="flex items-center gap-2"
                    onSelect={() => toggleGenre(genre)}
                    >
                      <Check className={isSelected ? "opacity-100" : "opacity-0"} />
                      <span>{genre.name}</span>
                    </CommandItem>
                    <CollapsibleTrigger className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent">
                      <ChevronDown className="size-4" />
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="pl-8">
                      {getChildGenres(genre).map((child) => (
                        <CommandItem
                          key={child.id}
                          onSelect={() => onParentClick(child)}
                          className="flex items-center gap-2"
                        >
                          <span>{child.name}</span>
                        </CommandItem>
                      ))}
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
