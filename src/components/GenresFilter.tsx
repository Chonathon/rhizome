import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { Genre, GenreClusterMode, GraphType } from "@/types";
import {clusterColors, isTopLevelGenre} from "@/lib/utils";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import {useEffect, useState} from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    if (genres){
      setChecked(new Array(genres.length).fill(true));
    }
  }, [genres, genreClusterMode]);

  const onCheckboxChange = (genre: Genre, index: number) => {
    if (checked[index]) {
      onParentDeselect(genre);
    } else {
      onParentSelect(genre);
    }
    setChecked(checked.map((c, i) => i === index ? !c : c));
  }

  const onGenreClick = (genre: Genre, index: number) => {
    onParentClick(genre);
    setChecked(checked.map((c, i) => i === index));
  }

  return graphType !== "artists" ? null : (
    <ResponsivePanel
      trigger={
        
          <Button size='lg' variant='outline'>Genre
            <ChevronDown />
          </Button>
      }
      className="p-2 overflow-hidden"
      side="bottom"
    >
      {/* scrolling container */}
      <div className="overflow-y-auto max-h-120 rounded-2xl border border-accent shadow-sm bg-accent dark:dark:bg-background">
        <div className="flex flex-col gap-0.5 py-2 pl-4 pr-2">
          {/* Checkbox Items */}
          {genres
            // .filter((genre) => isTopLevelGenre(genre, genreClusterMode))
            .map((genre: Genre, index: number) => (
              <Label
                key={genre.id}
                htmlFor={genre.id}
                className="text-md text-foreground flex items-center gap-2 py-2 cursor-pointer"
              >
                <Checkbox
                    checked={checked[index]}
                    id={genre.id}
                    onCheckedChange={() => onCheckboxChange(genre, index)}
                />

                {/* colored dot */}

                <span
                    className="w-full"
                    //onClick={() => onGenreClick(genre, index)}
                >
                  {genre.name}
                </span>
                <Button
                  variant="ghost"
                  className="p-2"
                  // TODO: Add click handler to change cluster/genre color
                >
                  <span
                    className="
                      p-2 w-4 h-4 shrink-0
                      rounded-full inline-block"
                    style={{
                      backgroundColor:
                        clusterColors[index % clusterColors.length],
                    }}
                  />
                </Button>
              </Label>
            ))}
        </div>
        {/* overflow gradient */}
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white/80 to-transparent dark:from-black/27" />
    </ResponsivePanel>
  );
}
