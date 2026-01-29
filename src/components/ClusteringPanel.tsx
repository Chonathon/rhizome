import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spline, RotateCcw, Loader2 } from "lucide-react";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { ClusterResult } from "@/lib/ClusteringEngine";

interface ClusteringPanelProps {
    graphType: 'genres' | 'artists';
    clusterMode: string;
    setClusterMode: (mode: string[]) => void;
    dagMode: boolean;
    setDagMode: (enabled: boolean) => void;
    artistColorMode?: 'genre' | 'cluster';
    setArtistColorMode?: (mode: 'genre' | 'cluster') => void;
    genreColorLegend?: { id: string; name: string; color: string }[];
    artistClusters?: ClusterResult | null;
    clusteringInProgress?: boolean;
}

export default function ClusteringPanel({ 
    graphType, 
    clusterMode, 
    setClusterMode, 
    dagMode, 
    setDagMode,
    artistColorMode,
    setArtistColorMode,
    genreColorLegend,
    artistClusters,
    clusteringInProgress
}: ClusteringPanelProps) {

    const genreOptions = [
        { id: "subgenre", label: "Hierarchy", description: "Clusters genres based on their parent-child relationships, such as 'rock' and its subgenre 'alternative rock'." },
        { id: "influence", label: "Influence", description: "Visualizes how genres have influenced each other over time, revealing historical connections and the evolution of musical styles." },
        { id: "fusion", label: "Fusion", description: "Highlights genres that have merged to create new, hybrid genres, like 'jazz fusion' or 'folk punk'." },
    ];

    const artistOptions = [
        { id: "similarArtists", label: "Similar Artists", description: "Uses the existing artist network structure to find communities. Artists connected by similar artist links form clusters." },
        { id: "hybrid", label: "Hybrid", description: "Combines vector-based similarity with the artist network to form more robust communities." },
        { id: "popularity", label: "Popularity", description: "Arranges artists in concentric rings by listener count. Popular artists at center, underground at outer ring." },
    ];

    const options = graphType === 'genres' ? genreOptions : artistOptions;

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
         {/* header */}
                <div className="flex items-center pl-2 mb-1 h-10">
                    <h2 className="text-lg w-full font-semibold leading-tight text-foreground">Clustering</h2>
                    <Button
                    // onClick={handleResetClick}
                    variant="ghost" size="icon" className=" size-10">

                    </Button>
                </div>   
            <RadioGroup
                value={clusterMode}
                onValueChange={(value) => setClusterMode([value])}
                className="flex flex-col items-start w-full gap-1 dark:bg-background shadow-sm rounded-2xl  bg-accent"            >
                {options.map((option) => (
                    <div key={option.id} className="w-full">
                        <label
                            htmlFor={option.id}
                            className={`flex items-start w-full gap-3 rounded-xl p-3 transition-colors cursor-pointer ${
                                clusterMode === option.id ? "bg-gray-200 border-accent border dark:bg-accent" : "hover:bg-white/10 dark:hover:bg-black/10"
                            }`}
                        >
                            <RadioGroupItem
                                value={option.id}
                                id={option.id}
                                className="mt-1 sr-only"
                            />
                            <div className="flex flex-col items-start">
                                <span className="text-md font-semibold leading-none text-foreground">
                                    {option.label}
                                </span>
                                <AnimatePresence mode="wait" initial={false}>
                                    {clusterMode === option.id && (
                                        <motion.p
                                            key={option.id}
                                            initial={{ opacity: 0, height: 0, y: -10 }}
                                            animate={{ opacity: 1, height: "auto", y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: -10 }}
                                            transition={{
                                                opacity: { duration: 0.2, ease: "easeOut" },
                                                height: { duration: 0.2, ease: "easeOut" },
                                                y: { duration: 0.08, ease: "easeOut" }
                                            }}
                                            className="text-sm text-muted-foreground mt-1 text-left"
                                        >
                                            {option.description}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </label>
                    </div>
                ))}
                {graphType === 'artists' && artistColorMode !== undefined && setArtistColorMode && (
                    <>
                        <div className="flex items-center justify-between w-full p-3 border-t border-border mt-2 pt-3">
                            <div className="flex flex-col">
                                <span className="text-md font-semibold leading-none text-gray-900 dark:text-gray-100">Color Mode</span>
                                <span className="text-sm text-muted-foreground mt-1">Choose how artists are colored in the graph.</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={artistColorMode === 'genre' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setArtistColorMode('genre')}
                                >
                                    Genre
                                </Button>
                                <Button
                                    variant={artistColorMode === 'cluster' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setArtistColorMode('cluster')}
                                >
                                    Cluster
                                </Button>
                            </div>
                        </div>
                        {artistColorMode === 'genre' && genreColorLegend && genreColorLegend.length > 0 && (
                            <div className="flex flex-col gap-2 w-full p-3 border-t border-border">
                                <span className="text-md font-semibold text-foreground">Genre Color Legend</span>
                                <div className=" overflow-y-auto pr-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                                        {genreColorLegend.map((genre) => (
                                            <div key={genre.id} className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="h-3 w-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: genre.color }}
                                                />
                                                <span className="text-sm text-foreground truncate">
                                                    {genre.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground mt-4">Multi-root genres blend colors.</span>
                            </div>
                        )}
                        {clusteringInProgress && (
                            <div className="flex items-center gap-2 w-full p-3 border-t border-border">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Computing clusters...</span>
                            </div>
                        )}
                        {!clusteringInProgress && artistClusters && artistClusters.stats && (
                            <div className="flex flex-col gap-2 w-full p-3 border-t border-border">
                                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Cluster Stats</span>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <div>Communities: {artistClusters.stats.clusterCount}</div>
                                    <div>Avg size: {Math.round(artistClusters.stats.avgClusterSize)} artists</div>
                                    <div>Largest: {artistClusters.stats.largestCluster} artists</div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {graphType === 'genres' && (
                    <div className="flex items-center justify-between w-full p-3">
                        <div className="flex flex-col">
                            <span className="text-md font-semibold leading-none text-gray-900 dark:text-gray-100">DAG Mode</span>
                            <span className="text-sm text-muted-foreground mt-1">Display as a directed acyclic graph.</span>
                        </div>
                        <Switch checked={dagMode} onCheckedChange={setDagMode} />
                    </div>
                )}
            </RadioGroup>
        </ResponsivePanel>
    )
}
