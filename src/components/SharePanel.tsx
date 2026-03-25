import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Download, Link, Check } from "lucide-react"
import { ResponsivePanel } from "@/components/ResponsivePanel"
import { toast } from "sonner"
import { clientUrl } from "@/lib/utils"

interface SharePanelProps {
    onExport?: () => void;
}

export default function SharePanel({ onExport }: SharePanelProps) {
    const [copied, setCopied] = useState(false);
    const feildsetStyles = "flex flex-col gap-3 p-3 rounded-2xl bg-accent dark:bg-accent/50 border-accent border"

    const handleCopyUrl = async () => {
        const shareUrl = clientUrl() + window.location.search;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    return (
        <ResponsivePanel
            trigger={
                <Button variant="outline" size="icon" className="h-10 w-10" title="Share">
                    <Share2 className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Share Options</span>
                </Button>
            }
            className="w-sm"
            side="left"
        >
            {/* header */}
            <div className="flex items-center pl-2 mb-1 h-10">
                <h2 className="text-lg w-full font-semibold leading-tight text-foreground">Share & Export</h2>
                <Button variant="ghost" size="icon" className="size-10" />
            </div>
            <div className="flex flex-col gap-2">
                {/* Export Section */}
                <div className={feildsetStyles}>
                    <div className="flex flex-col gap-1">
                        <span className="text-md font-semibold leading-none text-gray-900 dark:text-gray-100">
                            Export Graph
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
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
            </div>
        </ResponsivePanel>
    )
}
