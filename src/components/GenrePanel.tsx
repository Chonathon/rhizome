import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import { Genre, GenreClusterMode } from "@/types";
import { isParentGenre } from "@/lib/utils";
import { clusterColors } from "@/lib/utils";

export default function GenrePanel({
  genres,
  genreClusterMode,
}: {
  genres: Genre[];
  genreClusterMode: GenreClusterMode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Tag className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Display Settings</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="left"
        align="start"
        className="w-sm p-2 overflow-hidden"
      >
        {/* scrolling container */}
        <div className="overflow-y-auto max-h-120 rounded-xl border border-accent shadow-sm bg-accent dark:dark:bg-background">
          <div className="flex flex-col gap-0.5 py-2 pl-4 pr-2">
            {genres
              .filter((genre) => isParentGenre(genre, genreClusterMode))
              .map((genre: Genre, index: number) => (
                <Label
                  key={genre.id}
                  htmlFor={genre.id}
                  className="text-md text-foreground flex items-center gap-2 py-2 cursor-pointer"
                >
                  {/* TODO: Add click handler to toggle visibility of genre/cluster */}
                  <Checkbox defaultChecked id={genre.id} />

                  {/* colored dot */}

                  <span className="w-full">{genre.name}</span>
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
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-black/27" />
      </PopoverContent>
    </Popover>
  );
}