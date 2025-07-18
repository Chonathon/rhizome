import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tag } from "lucide-react"
import { Genre, NodeLink } from "@/types";

interface GenrePanelProps {
  genres: Genre[];
}

export default function GenrePanel({ genres }: GenrePanelProps) {
    genres.map((genre) => (
        <div key={genre.name} className="flex items-center justify-between p-2 border-b border-gray-200">
            <span className="text-sm font-medium">{genre.name}</span>
            <span className="text-xs text-gray-500">{genre.artistCount} artists</span>
        </div>
    ));
    return (
        // <div className="flex flex-col items-start w-full align-start h-10 gap-0.5 p-1 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
        // </div>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
            <Tag className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Display Settings</span>
          </Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-72 p-4 bg-white border border-gray-200 rounded-xl shadow-md">
                {/* Content for the genre panel goes here */}
                <p>Select a genre to explore its artists and links.</p>
            </PopoverContent>
        </Popover>
    )
}