import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Loading } from "./Loading"
import {NODE_AMOUNT_PRESETS, MAX_NODES} from "@/constants";

interface NodeLimiterProps {
  initialValue: number;
  onChange: (value: number) => void;
  totalNodes: number;
  nodeType: string;
  show: boolean;
}

export default function NodeLimiter({ initialValue, onChange, totalNodes, nodeType, show }: NodeLimiterProps) {
    const [value, setValue] = useState<number>(initialValue);
    const [presets, setPresets] = useState<number[]>(NODE_AMOUNT_PRESETS);
    const onValueChange = (newValue: number) => {
        setValue(newValue);
        onChange(newValue);
    }

    useEffect(() => {
        if (totalNodes) {
            if (nodeType === "collection") setPresets(Array.from({length: 20}, (x, i) => i));
            else setPresets(NODE_AMOUNT_PRESETS.filter(p => p < totalNodes));
        }
    }, [totalNodes]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return show ? (
        <div
        className="
        flex gap-2 items-center
        ">
            <p className="text-muted-foreground">Displaying</p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">{value}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {totalNodes && (totalNodes < MAX_NODES || nodeType === 'genres') && (
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
