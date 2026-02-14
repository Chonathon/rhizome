import { Button } from "@/components/ui/button"
import { Share2, Download } from "lucide-react"
import { ResponsivePanel } from "@/components/ResponsivePanel"

interface SharePanelProps {
    onExport?: () => void;
}

export default function SharePanel({ onExport }: SharePanelProps) {
    return (
        <ResponsivePanel
            trigger={
                <Button variant="outline" size="icon" className="h-10 w-10">
                    <Share2 className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Share Options</span>
                </Button>
            }
            className="w-sm"
            side="left"
            headerTitle="Share & Export"
        >
            <div className="flex flex-col gap-4 p-2 rounded-2xl shadow-sm bg-accent dark:bg-background">
                {/* Export Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-md font-semibold text-foreground">
                            Export Graph
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Download the current graph view as a high-resolution PNG image
                        </span>
                    </div>
                    {onExport && (
                        <Button
                            onClick={onExport}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export as Image
                        </Button>
                    )}
                </div>

                {/* Future share options can go here */}
                {/* 
                - Scaling Options
                - Other sharing options */}
            </div>
        </ResponsivePanel>
    )
}
