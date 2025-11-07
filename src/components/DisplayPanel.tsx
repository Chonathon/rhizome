import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "./ui/badge"
import { Button } from "@/components/ui/button"
import { SwatchBook, RotateCcw } from "lucide-react"
import { ResponsivePanel } from "@/components/ResponsivePanel"
import { motion } from "framer-motion"
import { Input } from "./ui/input"
import { ButtonGroup } from "./ui/button-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface DisplayPanelProps {
    genreArtistCountThreshold: number;
    setGenreArtistCountThreshold: (count: number) => void;
}

export default function DisplayPanel({ genreArtistCountThreshold, setGenreArtistCountThreshold }: DisplayPanelProps) {
    const [nodeSize, setNodeSize] = useState(50)
    const [linkThickness, setLinkThickness] = useState(50)
    const [linkCurvature, setLinkCurvature] = useState(50)
    const [textFadeThreshold, setTextFadeThreshold] = useState(50)
    //const [genreSizeThreshold, setGenreSizeThreshold] = useState(genreArtistCountThreshold)
    const [showLabels, setShowLabels] = useState(true)
    const [labelSize, setLabelSize] = useState(14)
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
    const feildsetStyles = "flex flex-col gap-4 p-2 rounded-2xl  shadow-sm bg-accent dark:dark:bg-accent/50 border-accent border"

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
            {/* header */}
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
                {/* content */}
            <div className="flex flex-col gap-3">
                <fieldset  className={feildsetStyles}>
                    <legend className="sr-only">Graph Options</legend>
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
                    {/* Link Thickness */}
                    <div className="flex items-center justify-start gap-6">
                        <label htmlFor="link-thickness" className={labelStyles}>Link Thickness</label>
                        <div className="w-full flex items-center gap-2">
                            <Badge variant="outline" className={badgeStyles}>{linkThickness}</Badge>
                            <Slider
                                id="link-thickness-slider"
                                aria-labelledby="link-thickness"
                                value={[linkThickness]}
                                onValueChange={([value]) => setLinkThickness(value)}
                                min={0}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>
                    {/* Link Curvature */}
                    <div className="flex items-center justify-start gap-6">
                        <label htmlFor="link-thickness" className={labelStyles}>Link Curvature</label>
                        <div className="w-full flex items-center gap-2">
                            <Badge variant="outline" className={badgeStyles}>{linkThickness}</Badge>
                            <Slider
                                id="link-curvature-slider"
                                aria-labelledby="link-thickness"
                                value={[linkCurvature]}
                                onValueChange={([value]) => setLinkThickness(value)}
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
                </fieldset>
                    <fieldset className={feildsetStyles}>
                        <legend className="sr-only">Text options</legend>
                        <div className="flex items-center justify-start gap-6">
                            <label htmlFor="show-labels" className={labelStyles}>Show Labels</label>
                            <Switch
                                id="show-labels"
                                checked={showLabels}
                                onCheckedChange={setShowLabels}
                            />
                        </div>
                        
                        {showLabels &&
                        <>
                            <div className="flex items-center justify-start gap-6">
                                <label htmlFor="show-labels" className={labelStyles}>Text Size</label>
                                {/* <Input
                                    id="show-labels"
                                    type="number"
                                    value={labelSize}
                                    className="w-20"
                                    onChange={(e) => setLabelSize(Number(e.target.value))}
                                /> */}
                                <Select value="Default">
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={labelSize.toString()}  />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["Small", "Default", "Large"].map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={size.toString()}
                                                onClick={() => setLabelSize(size)}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Text Fade Threshold */}
                                                <div className="flex items-center justify-start gap-6">
                            <label htmlFor="text-fade-threshold" className={labelStyles}>Label Fade Threshold</label>
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
                    </>}
                    </fieldset>
            </div>
        </ResponsivePanel>
    )
}
