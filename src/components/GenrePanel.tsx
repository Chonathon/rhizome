import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import useGenres from "@/hooks/useGenres";
import {Genre, GenreClusterMode} from "@/types";
import { isParentGenre } from "@/lib/utils";


export default function GenrePanel({genres, genreClusterMode}: {genres: Genre[], genreClusterMode: GenreClusterMode}) {

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
        className="w-72 p-2 overflow-hidden"
      >
        {/* scrolling container */}
          {/* <h3 className="text-md px-3 py-2 text-accent-foreground font-semibold ">Genre clusters</h3> */}
          {/* content */}
        <div className="overflow-y-auto max-h-120 rounded-xl border border-accent shadow-xs 
          bg-accent">
          <div className="
          flex flex-col gap-0.5 py-2 pl-4 ">
            {genres.filter(genre => isParentGenre(genre, genreClusterMode)).map(((genre: Genre) => (
                  <Label htmlFor={genre.id} className="text-md text-foreground flex items-center py-2 cursor-pointer">
                  <Checkbox defaultChecked
                  id={genre.id}/>
                  {genre.name}
                  </Label>

            )))}
          </div>
           {/* overflow gradient */}
        </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-black/40" />
      </PopoverContent>
    </Popover>
  );
}