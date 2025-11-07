import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "./ui/badge"
import { Button } from "@/components/ui/button"
import { SwatchBook, RotateCcw } from "lucide-react"
import { ResponsivePanel } from "@/components/ResponsivePanel"
import { motion } from "framer-motion"

interface DisplayPanelProps {
    genreArtistCountThreshold: number;
    setGenreArtistCountThreshold: (count: number) => void;
}

export default function DisplayPanel({ genreArtistCountThreshold, setGenreArtistCountThreshold }: DisplayPanelProps) {
    const [nodeSize, setNodeSize] = useState(50)
    const [edgeThickness, setEdgeThickness] = useState(50)
    const [textFadeThreshold, setTextFadeThreshold] = useState(50)
    //const [genreSizeThreshold, setGenreSizeThreshold] = useState(genreArtistCountThreshold)
    const [showLabels, setShowLabels] = useState(false)
    // TODO: Reset logic for graph controls can be implemented here
    const [isRotating, setIsRotating] = useState(false);
    const handleResetClick = () => {
      setIsRotating(true);
      setTimeout(() => {
        setIsRotating(false);
      }, 200)
    }
    const labelStyles = "w-full text-left text-md font-medium text-foreground"
    const badgeStyles = "w-12 p-1 text-center"

    return (
        <ResponsivePanel
            trigger={
                <Button variant="outline" size="icon" className="h-10 w-10">
                    <SwatchBook className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Display Settings</span>
                </Button>
            }
            className="w-sm"
            side="left"
            headerTitle="Display Settings"
        >
                <div className="flex items-center pl-2 mb-1">
                    <h2 className="text-lg w-full font-semibold leading-tight text-foreground">Display</h2>
                    <Button
                    onClick={handleResetClick}
                    variant="ghost" size="icon" className=" size-10">
                    <motion.div
                        animate={ 
                            isRotating 
                            ? { rotate: -45 } : { rotate: 0 } }
                            transition={{ type: "spring", stiffness: 600, damping: 12 }}
                                   >
                        <RotateCcw  />
                    </motion.div>
                    </Button>
                </div>
            <div className="flex flex-col gap-4 p-2 rounded-2xl  shadow-sm bg-accent dark:dark:bg-accent/50 border-accent border">
                {/* Node Size */}
                <div className="flex items-center justify-start gap-6">
                    <label htmlFor="node-size" className={labelStyles}>Node Size</label>
                    <div className="w-full flex items-center gap-2">
                        <Badge variant="outline" className={badgeStyles}>{nodeSize}</Badge>
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
                    <label htmlFor="edge-thickness" className={labelStyles}>Edge thickness</label>
                    <div className="w-full flex items-center gap-2">
                        <Badge variant="outline" className={badgeStyles}>{edgeThickness}</Badge>
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
                {/* Edge Curvature */}
                <div className="flex items-center justify-start gap-6">
                    <label htmlFor="edge-thickness" className={labelStyles}>Edge Curvature</label>
                    <div className="w-full flex items-center gap-2">
                        <Badge variant="outline" className={badgeStyles}>{edgeThickness}</Badge>
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
                    <label htmlFor="text-fade-threshold" className={labelStyles}>Text Fade Threshold</label>
                    <div className="w-full flex items-center gap-2">
                        <Badge variant="outline" className={badgeStyles}>{textFadeThreshold}</Badge>
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
                {/* Genre Min Size */}
                {/*<div className="flex items-center justify-start gap-6">*/}
                {/*    <label htmlFor="genre-min-size" className={labelStyles}>Genre Min Size</label>*/}
                {/*    <div className="w-full flex items-center gap-2">*/}
                {/*        <Badge variant="outline" className={badgeStyles}>{genreArtistCountThreshold}</Badge>*/}
                {/*        <Slider*/}
                {/*            id="genre-min-size-slider"*/}
                {/*            aria-labelledby="genre-min-size"*/}
                {/*            value={[genreArtistCountThreshold]}*/}
                {/*            onValueChange={([value]) => setGenreArtistCountThreshold(value)}*/}
                {/*            min={0}*/}
                {/*            max={120}*/}
                {/*            step={1}*/}
                {/*            className="w-full"*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*</div>*/}
                <fieldset className="flex flex-col gap-4">
                    <legend className="sr-only">Display options</legend>
                    <div className="flex items-center justify-between">
                        <label htmlFor="show-labels" className={labelStyles}>Show labels</label>
                        <Switch
                            id="show-labels"
                            checked={showLabels}
                            onCheckedChange={setShowLabels}
                        />
                    </div>
                </fieldset>
            </div>
        </ResponsivePanel>
    )
}
