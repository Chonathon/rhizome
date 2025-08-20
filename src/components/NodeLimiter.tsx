import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "./ui/badge"
import { Button } from "@/components/ui/button"
import { SwatchBook } from "lucide-react"
import { ResponsivePanel } from "@/components/ResponsivePanel"

export default function DisplayPanel() {
    const [nodeSize, setNodeSize] = useState(50)
    const [edgeThickness, setEdgeThickness] = useState(50)
    const [textFadeThreshold, setTextFadeThreshold] = useState(50)
    const [showLabels, setShowLabels] = useState(false)
    const [showArtistImage, setShowArtistImage] = useState(false)
    const [showUnfollowedArtists, setShowUnfollowedArtists] = useState(false)

    return (
        <div>
            <ResponsivePanel
                trigger={
                    <Button variant="outline" size="sm">
                        <SwatchBook className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">Display Settings</span>
                    </Button>
                }
                className="w-sm"
            >
                <div className="flex flex-col gap-4 p-2 rounded-2xl border border-accent shadow-sm bg-accent dark:dark:bg-background">
            
                </div>
            </ResponsivePanel>
        </div>
    )
}
