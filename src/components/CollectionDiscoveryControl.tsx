import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CollectionDiscoveryControlProps {
  degree: number;
  onDegreeChange: (value: number) => void;
  maxDegree?: number;
  loading?: boolean;
  disabled?: boolean;
  discoveryCount?: number;
}

const DEGREE_LABELS = [
  "Collection only",
  "1 hop away",
  "2 hops away",
  "3 hops away",
  "4 hops away",
];

export function CollectionDiscoveryControl({
  degree,
  onDegreeChange,
  maxDegree = 3,
  loading = false,
  disabled = false,
  discoveryCount = 0,
}: CollectionDiscoveryControlProps) {
  const cappedDegree = Math.min(degree, maxDegree);
  const label = DEGREE_LABELS[cappedDegree] || `${cappedDegree} hops away`;

  return (
    <div
      className="flex w-64 flex-col gap-2 rounded-2xl border border-border bg-background/90 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Discovery radius</span>
          <span className="text-sm text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 px-2 text-xs font-medium",
              disabled ? "opacity-50" : discoveryCount > 0 ? "text-emerald-600 dark:text-emerald-300" : ""
            )}
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : discoveryCount > 0 ? (
              `+${discoveryCount}`
            ) : (
              "0"
            )}
          </Badge>
          <Badge
            variant="outline"
            className={cn("shrink-0 px-2", disabled ? "opacity-50" : "")}
          >
            {cappedDegree}
          </Badge>
        </div>
      </div>
      <Slider
        value={[cappedDegree]}
        onValueChange={([value]) => onDegreeChange(value)}
        min={0}
        max={maxDegree}
        step={1}
        disabled={disabled || loading}
      />
      <span className="text-xs text-muted-foreground">
        Pull similar artists beyond your collection up to the selected hop count.
      </span>
    </div>
  );
}

export default CollectionDiscoveryControl;
