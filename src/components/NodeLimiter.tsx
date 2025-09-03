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
  initialValue: number;
  onChange: (value: number) => void;
  totalNodes: number;
  nodeType: string;
  show: boolean;
}

const MAX_NODES = 40000;
const ALL_PRESETS = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50]

export default function NodeLimiter({ initialValue, onChange, totalNodes, nodeType, show }: NodeLimiterProps) {
    const [value, setValue] = useState<number>(initialValue);
    const [presets, setPresets] = useState<number[]>(ALL_PRESETS);
    const onValueChange = (newValue: number) => {
        setValue(newValue);
        onChange(newValue);
    }

    useEffect(() => {
        if (totalNodes) {
            setPresets(ALL_PRESETS.filter(p => p < totalNodes));
        }
    }, [totalNodes]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return show ? (
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
                    {totalNodes && totalNodes < MAX_NODES && (
                        <DropdownMenuItem onClick={() => onValueChange(totalNodes)}>
                            {totalNodes}
                        </DropdownMenuItem>
                    )}
                    {presets.map((preset) => (
                        <DropdownMenuItem
                            key={preset}
                            onClick={() => {
                                onValueChange(preset)
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
    ) : null;
}
