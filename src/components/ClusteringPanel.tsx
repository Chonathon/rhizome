import { GenreClusterMode } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spline, Loader2 } from "lucide-react";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Scope } from "@/state/controlSchema";
import { useScopedControl } from "@/state/scopedControls";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ClusteringPanelProps {
    clusterMode: GenreClusterMode;
    setClusterMode: (mode: GenreClusterMode[]) => void;
    dagMode: boolean;
    setDagMode: (enabled: boolean) => void;
    scope: Scope;
    showDiscovery?: boolean;
    discoveryDegree?: number;
    onDiscoveryDegreeChange?: (value: number) => void;
    discoveryLoading?: boolean;
    discoveryDisabled?: boolean;
    discoveryCount?: number;
    discoveryMax?: number;
}

export default function ClusteringPanel({
    clusterMode,
    setClusterMode,
    dagMode,
    setDagMode,
    scope,
    showDiscovery = false,
    discoveryDegree = 0,
    onDiscoveryDegreeChange,
    discoveryLoading = false,
    discoveryDisabled = false,
    discoveryCount = 0,
    discoveryMax = 3,
}: ClusteringPanelProps) {
    const options = [
        { id: "subgenre", label: "Hierarchy", description: "Clusters genres based on their parent-child relationships, such as 'rock' and its subgenre 'alternative rock'." },
        { id: "influence", label: "Influence", description: "Visualizes how genres have influenced each other over time, revealing historical connections and the evolution of musical styles." },
        { id: "fusion", label: "Fusion", description: "Highlights genres that have merged to create new, hybrid genres, like 'jazz fusion' or 'folk punk'." },
    ];

    const {
        value: nodeSizeValue,
        setValue: setNodeSizeValue,
        options: nodeSizeOptions,
        isUnavailable: nodeSizeUnavailable,
        isFallback: nodeSizeFallback,
        fallbackLabel: nodeSizeFallbackLabel,
    } = useScopedControl(scope, 'sizeBy')

    const {
        value: samplingModeValue,
        setValue: setSamplingModeValue,
        options: samplingModeOptions,
        isUnavailable: samplingModeUnavailable,
        isFallback: samplingModeFallback,
        fallbackLabel: samplingModeFallbackLabel,
    } = useScopedControl(scope, 'samplingMode')

    const {
        value: sortByValue,
        setValue: setSortByValue,
        options: sortByOptions,
        isUnavailable: sortByUnavailable,
        isFallback: sortByFallback,
        fallbackLabel: sortByFallbackLabel,
    } = useScopedControl(scope, 'sortBy')

    const {
        value: sortDirectionValue,
        setValue: setSortDirectionValue,
        options: sortDirectionOptions,
        isUnavailable: sortDirectionUnavailable,
        isFallback: sortDirectionFallback,
        fallbackLabel: sortDirectionFallbackLabel,
    } = useScopedControl(scope, 'sortDirection')

    return (
        <ResponsivePanel
            trigger={
                <Button className="bg-background backdrop-blur-xs rounded-full border border-border" variant="outline" size="icon" aria-label="Clustering Panel">
                    <span className="sr-only">Show Clustering Panel</span>
                    <Spline />
                </Button>
            }
            className="w-full w-sm"
            side="left"
        >
            <div className="flex w-full flex-col gap-6">
                <section className="space-y-3">
                    <SectionHeader title="Relationships" description="Configure how nodes connect and expand." />
                    <div className="rounded-2xl border border-border/40 bg-background/80 p-1 shadow-sm dark:border-border/60">
                        <RadioGroup
                            value={clusterMode}
                            onValueChange={(value) => setClusterMode([value as GenreClusterMode])}
                            className="flex flex-col gap-1"
                        >
                            {options.map((option) => (
                                <div key={option.id} className="w-full">
                                    <label
                                        htmlFor={option.id}
                                        className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                                            clusterMode === option.id
                                                ? 'border-primary/40 bg-primary/10 dark:border-primary/40 dark:bg-primary/20'
                                                : 'border-transparent hover:border-border/50 hover:bg-muted/40'
                                        }`}
                                    >
                                        <RadioGroupItem
                                            value={option.id}
                                            id={option.id}
                                            className="mt-1 sr-only"
                                        />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-semibold leading-none text-foreground">
                                                {option.label}
                                            </span>
                                            <AnimatePresence mode="wait" initial={false}>
                                                {clusterMode === option.id && (
                                                    <motion.p
                                                        key={option.id}
                                                        initial={{ opacity: 0, height: 0, y: -6 }}
                                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                        exit={{ opacity: 0, height: 0, y: -6 }}
                                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                                        className="mt-1 text-sm text-muted-foreground"
                                                    >
                                                        {option.description}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                        <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-background/70 px-3 py-2">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold leading-none text-foreground">DAG mode</span>
                                <span className="text-xs text-muted-foreground mt-1">Display connections as a directed acyclic graph.</span>
                            </div>
                            <Switch checked={dagMode} onCheckedChange={setDagMode} />
                        </div>
                    </div>
                    {showDiscovery && (
                        <div className="rounded-xl border border-border/40 bg-background/80 p-4 shadow-sm dark:border-border/60">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold leading-none text-foreground">Discovery radius</span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        Surface similar artists up to {discoveryDegree} hop{discoveryDegree === 1 ? '' : 's'} away.
                                    </span>
                                </div>
                                <Badge variant="outline" className="shrink-0 px-2 text-xs font-semibold">
                                    {discoveryLoading ? <Loader2 className="size-3 animate-spin" /> : discoveryCount > 0 ? `+${discoveryCount}` : '0'}
                                </Badge>
                            </div>
                            <div className="mt-3">
                                <Slider
                                    value={[Math.min(discoveryDegree, discoveryMax)]}
                                    onValueChange={([value]) => onDiscoveryDegreeChange?.(value)}
                                    min={0}
                                    max={discoveryMax}
                                    step={1}
                                    disabled={discoveryDisabled || discoveryLoading}
                                />
                                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                    <span>0</span>
                                    <span>{discoveryMax} hops</span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionHeader title="Sampling" description="Control how we pick which nodes to surface." />
                    <div className="rounded-xl border border-border/40 bg-background/80 p-4 shadow-sm dark:border-border/60 space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">Sampling mode</span>
                                {samplingModeFallback && samplingModeFallbackLabel ? (
                                    <span className="text-xs text-muted-foreground">Fallback to {samplingModeFallbackLabel}</span>
                                ) : null}
                            </div>
                            <div className="mt-2">
                                {samplingModeUnavailable || !samplingModeOptions?.length ? (
                                    <p className="text-xs text-muted-foreground">Not available in this scope.</p>
                                ) : (
                                    <Select value={samplingModeValue} onValueChange={setSamplingModeValue}>
                                        <SelectTrigger size="sm" className="w-full justify-between">
                                            <SelectValue placeholder="Select sampling" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {samplingModeOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">Sort nodes by</span>
                                {sortByFallback && sortByFallbackLabel ? (
                                    <span className="text-xs text-muted-foreground">Fallback to {sortByFallbackLabel}</span>
                                ) : null}
                            </div>
                            <div className="mt-2">
                                {sortByUnavailable || !sortByOptions?.length ? (
                                    <p className="text-xs text-muted-foreground">Not available in this scope.</p>
                                ) : (
                                    <Select value={sortByValue} onValueChange={setSortByValue}>
                                        <SelectTrigger size="sm" className="w-full justify-between">
                                            <SelectValue placeholder="Select sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sortByOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="mt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Order</span>
                                    {sortDirectionFallback && sortDirectionFallbackLabel ? (
                                        <span className="text-xs text-muted-foreground">Fallback to {sortDirectionFallbackLabel}</span>
                                    ) : null}
                                </div>
                                {sortDirectionUnavailable || !sortDirectionOptions?.length ? (
                                    <p className="mt-1 text-xs text-muted-foreground">Not available in this scope.</p>
                                ) : (
                                    <Select value={sortDirectionValue} onValueChange={setSortDirectionValue}>
                                        <SelectTrigger size="sm" className="mt-1 w-full justify-between">
                                            <SelectValue placeholder="Select order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sortDirectionOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionHeader title="Node display" description="Adjust how nodes scale in the graph." />
                    <div className="rounded-xl border border-border/40 bg-background/80 p-4 shadow-sm dark:border-border/60">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">Size nodes by</span>
                            {nodeSizeFallback && nodeSizeFallbackLabel ? (
                                <span className="text-xs text-muted-foreground">Fallback to {nodeSizeFallbackLabel}</span>
                            ) : null}
                        </div>
                        <div className="mt-2">
                            {nodeSizeUnavailable || !nodeSizeOptions?.length ? (
                                <p className="text-xs text-muted-foreground">Not available in this scope.</p>
                            ) : (
                                <Select value={nodeSizeValue} onValueChange={setNodeSizeValue}>
                                    <SelectTrigger size="sm" className="w-full justify-between">
                                        <SelectValue placeholder="Select metric" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {nodeSizeOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </ResponsivePanel>
    )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
            {description ? <p className="text-xs text-muted-foreground/80">{description}</p> : null}
        </div>
    )
}
