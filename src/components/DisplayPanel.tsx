import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "./ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { SwatchBook } from "lucide-react"


export default function DisplayPanel() {
    const [nodeSize, setNodeSize] = useState(50)
    const [edgeThickness, setEdgeThickness] = useState(50)
    const [textFadeThreshold, setTextFadeThreshold] = useState(50)
    const [showLabels, setShowLabels] = useState(false)
    const [showArtistImage, setShowArtistImage] = useState(false)
    const [showUnfollowedArtists, setShowUnfollowedArtists] = useState(false)

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <SwatchBook className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Display Settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-sm">
          <div className="flex flex-col gap-4 p-2">
            {/* Node Size */}
            <div className="flex items-center justify-start gap-6">
              <label htmlFor="node-size" className="w-full text-left
    text-md font-medium text-gray-900 dark:text-gray-100">Node Size</label>
              <div className="w-full flex items-center gap-2">
                <Badge variant="outline" className="w-12 p-1 text-center">{nodeSize}</Badge>      
                <Slider
                  id="node-size-slider"
                  aria-labelledby="node-size"
                  value={[nodeSize]}
                  onValueChange={([value]) => setNodeSize(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            {/* Edge Thickness */}
            <div className="flex items-center justify-start gap-6">
              <label htmlFor="edge-thickness" className="w-full text-left text-md font-medium text-gray-900 dark:text-gray-100">Edge thickness</label>
              <div className="w-full flex items-center gap-2">
              <Badge variant="outline" className="w-12 p-1 text-center">{edgeThickness}</Badge>      

                <Slider
                  id="edge-thickness-slider"
                  aria-labelledby="edge-thickness"
                  value={[edgeThickness]}
                  onValueChange={([value]) => setEdgeThickness(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            {/* Text Fade Threshold */}
            <div className="flex items-center justify-start gap-6">
              <label htmlFor="text-fade-threshold" className="w-full text-left text-md font-medium text-gray-900 dark:text-gray-100">Text Fade Threshold</label>
              <div className="w-full flex items-center gap-2">
              <Badge variant="outline" className="w-12 p-1 text-center">{textFadeThreshold}</Badge>      

                <Slider
                  id="text-fade-threshold-slider"
                  aria-labelledby="text-fade-threshold"
                  value={[textFadeThreshold]}
                  onValueChange={([value]) => setTextFadeThreshold(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            <fieldset className="flex flex-col gap-4">
              <legend className="sr-only">Display options</legend>
              <div className="flex items-center justify-between">
                <label htmlFor="show-labels" className="w-full text-left text-md font-medium text-gray-900 dark:text-gray-100">Show labels</label>
                <Switch
                  id="show-labels"
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="show-artist-image" className="w-full text-left text-md font-medium text-gray-900 dark:text-gray-100">Show artist image</label>
                <Switch
                  id="show-artist-image"
                  checked={showArtistImage}
                  onCheckedChange={setShowArtistImage}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="show-unfollowed-artists" className="w-full text-left text-md font-medium text-gray-900 dark:text-gray-100">Show unfollowed artists</label>
                <Switch
                  id="show-unfollowed-artists"
                  checked={showUnfollowedArtists}
                  onCheckedChange={setShowUnfollowedArtists}
                />
              </div>
            </fieldset>
          </div>
        </PopoverContent>
      </Popover>
    )
}