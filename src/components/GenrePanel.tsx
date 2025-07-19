import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import useGenres from "@/hooks/useGenres";
import { Genre } from "@/types";
import { isParentGenre } from "@/lib/utils";


export default function GenrePanel() {
  // Fetch genres once the component mounts
  const { genres, genresLoading, genresError } = useGenres();

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
        className="w-72 p-2"
      >
        {/* scrolling container */}
        <div className="overflow-y-auto max-h-120">
          {/* content */}
          <div className="
          flex flex-col gap-0.5 py-2 pl-4 rounded-xl
          bg-gray-50 border border-border">
            {genres.map(((genre: Genre) => (
                  <Label htmlFor={genre.id} className="flex items-center py-3 border-b cursor-pointer">
                  <Checkbox defaultChecked 
                  id={genre.id}/>
                  {genre.name}
                {/* <div key={genre.id} className="flex items-center py-2 cursor-pointer" > */}
                  </Label>
          
                // </div>
            //   <div
            //     key={genre.name}
            //     className="flex items-center justify-between p-2 border-b border-gray-200"
            //   >
            //     <span className="text-sm font-medium">{genre.name}</span>
            //     <span className="text-xs text-gray-500">{genre.artistCount} artists</span>
            //   </div>
            )))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}