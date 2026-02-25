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
    nodeSize: number;
    setNodeSize: (size: number) => void;
    linkThickness: number;
    setLinkThickness: (thickness: number) => void;
    linkCurvature: number;
    setLinkCurvature: (curvature: number) => void;
    textFadeThreshold: number;
    setTextFadeThreshold: (threshold: number) => void;
    showLabels: boolean;
    setShowLabels: (show: boolean) => void;
    priorityLabelMode: 'popularity' | 'central';
    setPriorityLabelMode: (mode: 'popularity' | 'central') => void;
    labelSize: 'Small' | 'Default' | 'Large';
    setLabelSize: (size: 'Small' | 'Default' | 'Large') => void;
    showNodes: boolean;
    setShowNodes: (show: boolean) => void;
    showLinks: boolean;
    setShowLinks: (show: boolean) => void;
    onReset: () => void;
    defaults?: {
        nodeSize: number;
        linkThickness: number;
        linkCurvature: number;
        textFadeThreshold: number;
        showLabels: boolean;
        priorityLabelMode: 'popularity' | 'central';
        labelSize: 'Small' | 'Default' | 'Large';
        showNodes: boolean;
        showLinks: boolean;
    };
}

export default function DisplayPanel({
    genreArtistCountThreshold,
    setGenreArtistCountThreshold,
    nodeSize,
    setNodeSize,
    linkThickness,
    setLinkThickness,
    linkCurvature,
    setLinkCurvature,
    textFadeThreshold,
    setTextFadeThreshold,
    showLabels,
    setShowLabels,
    priorityLabelMode,
    setPriorityLabelMode,
    labelSize,
    setLabelSize,
    showNodes,
    setShowNodes,
    showLinks,
    setShowLinks,
    onReset,
    defaults
}: DisplayPanelProps) {
    const [isRotating, setIsRotating] = useState(false);
    const handleResetClick = () => {
      setIsRotating(true);
      onReset();
      setTimeout(() => {
        setIsRotating(false);
      }, 200)
    }

    // Check if any value differs from defaults
    const hasChanges = defaults ? (
        nodeSize !== defaults.nodeSize ||
        linkThickness !== defaults.linkThickness ||
        linkCurvature !== defaults.linkCurvature ||
        textFadeThreshold !== defaults.textFadeThreshold ||
        showLabels !== defaults.showLabels ||
        priorityLabelMode !== defaults.priorityLabelMode ||
        labelSize !== defaults.labelSize ||
        showNodes !== defaults.showNodes ||
        showLinks !== defaults.showLinks
    ) : true;

    const labelStyles = "w-full text-left text-md font-medium text-foreground"
    const badgeStyles = "w-12 p-1 text-center"
    const feildsetStyles = "flex flex-col gap-4 p-2 rounded-2xl bg-accent dark:dark:bg-accent/50 border-accent border"

    return (
        <ResponsivePanel
            trigger={
                <Button variant="outline" size="icon" className="h-10 w-10" title="Display">
                    <SwatchBook className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Display Settings</span>
                </Button>
            }
            className="w-sm"
            side="left"
            headerTitle="Display Settings"
        >
            {/* header */}
                <div className="flex items-center pl-2 mb-1 h-10">
                    <h2 className="text-lg w-full font-semibold leading-tight text-foreground">Display</h2>
                    {hasChanges && (
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
                    )}
                </div>
                {/* content */}
            <div className="flex flex-col gap-3">
                {/* Node Options */}
                <fieldset className={feildsetStyles}>
                    <legend className="sr-only">Node Options</legend>
                    {/* Show Nodes Toggle */}
                    <div className="flex items-center justify-start gap-6">
                        <label htmlFor="show-nodes" className={labelStyles}>Show Nodes</label>
                        <Switch
                            id="show-nodes"
                            checked={showNodes}
                            onCheckedChange={setShowNodes}
                        />
                    </div>

                    {showNodes && (
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
                    )}
                </fieldset>

                {/* Link Options */}
                <fieldset className={feildsetStyles}>
                    <legend className="sr-only">Link Options</legend>
                    {/* Show Links Toggle */}
                    <div className="flex items-center justify-start gap-6">
                        <label htmlFor="show-links" className={labelStyles}>Show Links</label>
                        <Switch
                            id="show-links"
                            checked={showLinks}
                            onCheckedChange={setShowLinks}
                        />
                    </div>

                    {showLinks && (
                        <>
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
                                <label htmlFor="link-curvature" className={labelStyles}>Link Curvature</label>
                                <div className="w-full flex items-center gap-2">
                                    <Badge variant="outline" className={badgeStyles}>{linkCurvature}</Badge>
                                    <Slider
                                        id="link-curvature-slider"
                                        aria-labelledby="link-curvature"
                                        value={[linkCurvature]}
                                        onValueChange={([value]) => setLinkCurvature(value)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </>
                    )}
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
                            <div className="flex items-center justify-start gap-6">
                                <label htmlFor="priority-labels" className={labelStyles}>Priority Labels</label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={priorityLabelMode === 'popularity' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPriorityLabelMode('popularity')}
                                    >
                                        Popularity
                                    </Button>
                                    <Button
                                        variant={priorityLabelMode === 'central' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPriorityLabelMode('central')}
                                    >
                                        Central
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center justify-start gap-6">
                                <label htmlFor="text-size" className={labelStyles}>Text Size</label>
                                <Select value={labelSize} onValueChange={(value) => setLabelSize(value as 'Small' | 'Default' | 'Large')}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["Small", "Default", "Large"].map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={size}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                    </>}
                    </fieldset>
            </div>
        </ResponsivePanel>
    )
}
