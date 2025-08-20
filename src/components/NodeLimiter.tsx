import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Loading } from "./Loading"

interface NodeLimiterProps {
  initialValue?: number,
  onChange?: (value: number[]) => void
  totalNodes?: number
  nodeType?: string
}

export default function NodeLimiter({ initialValue = 200, onChange, totalNodes, nodeType }: NodeLimiterProps) {
    const [value, setValue] = useState<number[]>([200])
    useEffect(() => {
        onChange?.(value)
    }, [value, onChange])
    const presets = [1000, 500, 200, 100, 50]

    return (
        <div
        className="
        flex gap-2 p-2 items-center
        rounded-2xl border border-accent dark:border-input shadow-sm bg-accent dark:dark:bg-background backdrop-blur-sm">
            <p className="text-muted-foreground">Displaying</p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">{value}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {presets.map((preset) => (
                        <DropdownMenuItem
                            key={preset}
                            onClick={() => {
                                setValue([preset])
                            }}
                        >
                            {preset}
                        </DropdownMenuItem>
                    ))}
                    {/* <DropdownMenuItem>500</DropdownMenuItem>
                    <DropdownMenuItem>200</DropdownMenuItem>
                    <DropdownMenuItem>100</DropdownMenuItem>
                    <DropdownMenuItem>50</DropdownMenuItem> */}
                </DropdownMenuContent>
                </DropdownMenu>
                
                <p className="text-muted-foreground">of {totalNodes} {nodeType}</p>
        </div>
    )
}
