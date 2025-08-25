import { GenreClusterMode } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spline } from "lucide-react";
import { ResponsivePanel } from "@/components/ResponsivePanel";

interface ClusteringPanelProps {
    clusterMode: GenreClusterMode;
    setClusterMode: (mode: GenreClusterMode) => void;
    dagMode: boolean;
    setDagMode: (enabled: boolean) => void;
}

export default function ClusteringPanel({ clusterMode, setClusterMode, dagMode, setDagMode }: ClusteringPanelProps) {
    const options = [
        { id: "subgenre", label: "Hierarchy", description: "Clusters genres based on their parent-child relationships, such as 'rock' and its subgenre 'alternative rock'." },
        { id: "influence", label: "Influence", description: "Visualizes how genres have influenced each other over time, revealing historical connections and the evolution of musical styles." },
        { id: "fusion", label: "Fusion", description: "Highlights genres that have merged to create new, hybrid genres, like 'jazz fusion' or 'folk punk'." },
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
            <RadioGroup
                value={clusterMode}
                onValueChange={(value) => setClusterMode(value as GenreClusterMode)}
                className="flex flex-col items-start w-full gap-1 dark:bg-background shadow-sm p-1 rounded-2xl border border-accent dark:border-border/50 bg-accent"
            >
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
                                                y: { duration: 0.2, ease: "easeOut" }
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
                <div className="flex items-center justify-between w-full p-3">
                    <div className="flex flex-col">
                        <span className="text-md font-semibold leading-none text-gray-900 dark:text-gray-100">DAG Mode</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 mt-1">Display as a directed acyclic graph.</span>
                    </div>
                    <Switch checked={dagMode} onCheckedChange={setDagMode} />
                </div>
            </RadioGroup>
        </ResponsivePanel>
    )
}
