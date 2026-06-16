import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import GenreBadge from "@/components/GenreBadge";
import Gravity, { GravityRef, MatterBody } from "@/components/fancy/physics/gravity";
import * as d3 from "d3-force";

type SimNode = d3.SimulationNodeDatum & { id: number; r: number };
type ResolvedLink = { source: SimNode; target: SimNode };
type Phase = "simulating" | "settling" | "falling";

// Maps d3 coordinate space → SVG viewBox 0–100 during live simulation
const toSVG = (v: number) => 50 + v * 0.25;

export type GraphEmptyMode =
  | "collection-empty"
  | "collection-filtered"
  | "similar-artists"
  | "genre-and-filter"
  | "collection-and-filter";

const COPY: Record<GraphEmptyMode, { headline: string; body: string; cta?: string }> = {
  "collection-empty": {
    headline: "Your collection is empty",
    body: "Search for artists and add them to see your taste mapped.",
    cta: "Search artists",
  },
  "collection-filtered": {
    headline: "No artists match",
    body: "Try removing some genre or decade filters.",
    cta: "Clear filters",
  },
  "similar-artists": {
    headline: "No similar artists found",
    body: "Not enough data to map this artist's connections.",
  },
  // Explore mode filters the top-N artists loaded for the selection, so a
  // matching artist may exist outside that set — the copy can't claim "none exist"
  "genre-and-filter": {
    headline: "No artists match all genres",
    body: "None of the loaded artists are tagged with every selected genre.",
    cta: "Match any instead",
  },
  "collection-and-filter": {
    headline: "No artists match all genres",
    body: "No artists in your collection are tagged with every selected genre.",
    cta: "Match any instead",
  },
};

interface GraphEmptyStateProps {
  mode: GraphEmptyMode;
  onCta?: () => void;
  // Selected genres shown as removable badges (AND-filter modes)
  genreChips?: { id: string; name: string; color?: string }[];
  onRemoveGenre?: (id: string) => void;
}

// Entrance for badge rows: pops each badge in after the column settles
const badgeSpring = (delay: number) => ({
  initial: { opacity: 0, scale: 0.85, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { delay, type: "spring" as const, stiffness: 400, damping: 24 },
});

export function GraphEmptyState({ mode, onCta, genreChips, onRemoveGenre }: GraphEmptyStateProps) {
  const { headline, body, cta } = COPY[mode];
  const gravityRef = useRef<GravityRef>(null);
  const [phase, setPhase] = useState<Phase>("simulating");
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<ResolvedLink[]>([]);

  useEffect(() => {
    let fallTimeout: ReturnType<typeof setTimeout>;

    // Varied sizes matching the real graph's 3–25px range
    const simNodes: SimNode[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      r: 3 + Math.pow(i / 17, 2) * 22,
      x: (Math.random() - 0.5) * 30,
      y: (Math.random() - 0.5) * 30,
    }));

    const rawLinks = simNodes.flatMap((_, i) => {
      const targets = [(i + 1) % simNodes.length, (i + 5) % simNodes.length];
      if (i % 3 === 0) targets.push((i + 9) % simNodes.length);
      return targets.filter((t) => t !== i).map((target) => ({ source: i, target }));
    });

    const linkForce = d3
      .forceLink<SimNode, d3.SimulationLinkDatum<SimNode>>(rawLinks as d3.SimulationLinkDatum<SimNode>[])
      .id((d) => d.id)
      .distance(60)
      .strength(0.5);

    const sim = d3
      .forceSimulation(simNodes)
      .force("charge", d3.forceManyBody().strength(-190))
      .force("link", linkForce)
      .force("x", d3.forceX(0).strength(0.03))
      .force("y", d3.forceY(0).strength(0.03))
      .force("collide", d3.forceCollide<SimNode>((d) => d.r + 5))
      .alphaDecay(0.04)
      .on("tick", () => {
        setNodes([...simNodes]);
        setLinks(linkForce.links() as unknown as ResolvedLink[]);
      })
      .on("end", () => {
        setNodes([...simNodes]);
        setLinks(linkForce.links() as unknown as ResolvedLink[]);
        setPhase("settling");
        fallTimeout = setTimeout(() => setPhase("falling"), 700);
      });

    return () => {
      sim.stop();
      clearTimeout(fallTimeout);
    };
  }, []);

  // Start gravity shortly after MatterBody elements mount
  useEffect(() => {
    if (phase !== "falling") return;
    const t = setTimeout(() => gravityRef.current?.start(), 150);
    return () => clearTimeout(t);
  }, [phase]);

  const isFalling = phase === "falling";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        aria-hidden="true"
      >
        {/* Links + SVG nodes — toSVG maps d3 coords consistently throughout all phases */}
        <motion.svg
          className="absolute inset-0 w-full h-full text-foreground"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          animate={{ opacity: isFalling ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {links.map((link, i) => (
            <line
              key={i}
              x1={toSVG(link.source.x!)} y1={toSVG(link.source.y!)}
              x2={toSVG(link.target.x!)} y2={toSVG(link.target.y!)}
              stroke="currentColor"
              strokeWidth="0.2"
              opacity={0.06}
            />
          ))}

          {!isFalling &&
            nodes.map((n) => (
              <circle
                key={n.id}
                cx={toSVG(n.x!)}
                cy={toSVG(n.y!)}
                r={n.r / 8}
                fill="currentColor"
                opacity={0.09}
              />
            ))}
        </motion.svg>

        {/* Physics nodes — x/y use same toSVG scale so positions match SVG exactly */}
        {isFalling && (
          <Gravity
            ref={gravityRef}
            autoStart={false}
            grabCursor={false}
            addTopWall={false}
            gravity={{ x: 0, y: 3 }}
          >
            {nodes.map((n) => (
              <MatterBody
                key={n.id}
                x={`${toSVG(n.x!)}%`}
                y={`${toSVG(n.y!)}%`}
                bodyType="circle"
                isDraggable={false}
                matterBodyOptions={{ friction: 0.1, restitution: 0.8, density: 0.001, isStatic: false }}
              >
                <div
                  className="rounded-full bg-foreground"
                  style={{ width: n.r * 2, height: n.r * 2, opacity: 0.09 }}
                />
              </MatterBody>
            ))}
          </Gravity>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
        className="relative flex flex-col items-center gap-4 text-center pointer-events-auto px-6"
        style={{ maxWidth: 360, zIndex: 1 }}
      >
       
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold text-foreground tracking-tight leading-snug">
            {headline}
          </p>
          <p className="text-md text-muted-foreground">
            {body}
          </p>
        </div>

        {cta && onCta && (
          <Button size="lg" variant="default" onClick={onCta}>
            {cta}
          </Button>
        )}

        {genreChips && genreChips.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">
              or try removing a genre
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {genreChips.map((chip, i) => (
                <motion.span key={chip.id} {...badgeSpring(0.3 + i * 0.05)}>
                  <GenreBadge
                    name={chip.name}
                    variant="secondary"
                    genreColor={chip.color}
                    onClick={() => onRemoveGenre?.(chip.id)}
                    title={`Remove ${chip.name} from the filter`}
                    removable
                  />
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
