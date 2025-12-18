import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spline, RotateCcw } from "lucide-react";
import { ResponsivePanel } from "@/components/ResponsivePanel";
import { useState } from "react";

interface ClusteringPanelProps {
    graphType: 'genres' | 'artists';
    clusterMode: string;
    setClusterMode: (mode: string[]) => void;
    dagMode: boolean;
    setDagMode: (enabled: boolean) => void;
}

export default function ClusteringPanel({ graphType, clusterMode, setClusterMode, dagMode, setDagMode }: ClusteringPanelProps) {

    const options = graphType === 'genres'
        ? [
            { id: "subgenre", label: "Hierarchy", description: "Clusters genres based on their parent-child relationships, such as 'rock' and its subgenre 'alternative rock'." },
            { id: "influence", label: "Influence", description: "Visualizes how genres have influenced each other over time, revealing historical connections and the evolution of musical styles." },
            { id: "fusion", label: "Fusion", description: "Highlights genres that have merged to create new, hybrid genres, like 'jazz fusion' or 'folk punk'." },
        ]
        : [
            { id: "genre", label: "Genre", description: "Groups artists by their primary genre classification." },
            { id: "tags", label: "Tags", description: "Clusters artists by tag similarity using cosine distance." },
            { id: "similar", label: "Similar", description: "Creates connected components from similar artist relationships." },
            { id: "hybrid", label: "Hybrid", description: "Combines genre, tag, and similar artist signals for sophisticated clustering." },
        ];

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
                                <span className="text-md font-semibold leading-none text-gray-900 dark:text-gray-100">
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
                                            className="text-sm text-gray-700 dark:text-gray-300 mt-1 text-left"
                                        >
                                            {option.description}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </label>
                    </div>
                ))}
                {graphType === 'genres' && (
                    <div className="flex items-center justify-between w-full p-3">
                        <div className="flex flex-col">
                            <span className="text-md font-semibold leading-none text-gray-900 dark:text-gray-100">DAG Mode</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 mt-1">Display as a directed acyclic graph.</span>
                        </div>
                        <Switch checked={dagMode} onCheckedChange={setDagMode} />
                    </div>
                )}
            </RadioGroup>
        </ResponsivePanel>
    )
}
