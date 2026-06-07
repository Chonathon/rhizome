import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Gravity, { GravityRef, MatterBody } from "@/components/fancy/physics/gravity";
import * as d3 from "d3-force";

type SimNode = d3.SimulationNodeDatum & { id: number; r: number };
type ResolvedLink = { source: SimNode; target: SimNode };
type Phase = "simulating" | "settling" | "falling";

// Maps d3 coordinate space → SVG viewBox 0–100 during live simulation
const toSVG = (v: number) => 50 + v * 0.25;

export type GraphEmptyMode = "collection-empty" | "collection-filtered" | "similar-artists" | "genre-and-filter";

const COPY: Record<GraphEmptyMode, { headline: string; body: string; cta?: string }> = {
  "collection-empty": {
    headline: "Your collection is empty",
    body: "Search for artists and add them to see your taste mapped.",
    cta: "Search artists",
  },
  "collection-filtered": {
    headline: "No artists match",
    body: "Try removing some genre or decade filters.",
  },
  "similar-artists": {
    headline: "No similar artists found",
    body: "Not enough data to map this artist's connections.",
  },
  "genre-and-filter": {
    headline: "No artists match all genres",
    body: "No artists are tagged with every selected genre. Try switching to 'any'.",
  },
};

interface GraphEmptyStateProps {
  mode: GraphEmptyMode;
  onSearch?: () => void;
}

export function GraphEmptyState({ mode, onSearch }: GraphEmptyStateProps) {
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
        style={{ maxWidth: 268, zIndex: 1 }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 46 46"
          fill="none"
          className="text-foreground opacity-[0.18]"
        >
          <circle cx="23" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="37" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="38" cy="37" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="23" y1="14.5" x2="8" y2="31.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="23" y1="14.5" x2="38" y2="31.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="13.5" y1="37" x2="32.5" y2="37" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground tracking-tight leading-snug">
            {headline}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {body}
          </p>
        </div>

        {cta && onSearch && (
          <Button size="sm" variant="outline" onClick={onSearch}>
            {cta}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
