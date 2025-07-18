import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import useGenres from "@/hooks/useGenres";
import { Genre } from "@/types";


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
        className="w-72 p-4 bg-white border border-gray-200 rounded-xl shadow-md"
      >
        {genres.map((genre: Genre) => (

            <div>
                <Checkbox
                    key={genre.id}
                />
                <Label htmlFor={genre.id} className="ml-2">{genre.name}</Label>
            </div>

        //   <div
        //     key={genre.name}
        //     className="flex items-center justify-between p-2 border-b border-gray-200"
        //   >
        //     <span className="text-sm font-medium">{genre.name}</span>
        //     <span className="text-xs text-gray-500">{genre.artistCount} artists</span>
        //   </div>
        ))}

        <p className="mt-2 text-sm text-gray-600">
          Select a genre to explore its artists and links.
        </p>
      </PopoverContent>
    </Popover>
  );
}