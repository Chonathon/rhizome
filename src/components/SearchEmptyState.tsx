import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

interface SearchEmptyStateProps {
  variant: "idle" | "no-results";
  query?: string;
  onSeedSelect?: (seed: string) => void;
}

// A miniature rhizome: node positions and edges for the idle-state constellation
const NODES = [
  { x: 30, y: 78, r: 4, color: "var(--chart-1)" },
  { x: 74, y: 38, r: 5.5, color: "var(--chart-2)" },
  { x: 128, y: 64, r: 7, color: "var(--chart-3)", pulse: true },
  { x: 170, y: 26, r: 4, color: "var(--chart-4)" },
  { x: 196, y: 84, r: 4.5, color: "var(--chart-5)" },
  { x: 96, y: 102, r: 3, color: "var(--chart-1)" },
  { x: 154, y: 104, r: 3.5, color: "var(--chart-4)" },
  { x: 18, y: 28, r: 3, color: "var(--chart-2)" },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [2, 4], [1, 5], [2, 6], [7, 0], [3, 4],
];

const SEED_POOL = {
  genre: ["shoegaze", "krautrock", "dub techno", "ambient", "post-punk", "trip hop", "zeuhl", "bossa nova"],
  artist: ["Radiohead", "Aphex Twin", "Alice Coltrane", "Boards of Canada", "Fela Kuti", "Cocteau Twins", "Stereolab", "MF DOOM"],
};

const pickRandom = (pool: string[], count: number) =>
  [...pool].sort(() => Math.random() - 0.5).slice(0, count);

function Constellation({ animate }: { animate: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 214 120"
      className="w-52 text-muted-foreground"
      aria-hidden="true"
      animate={animate ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      {EDGES.map(([a, b], i) => (
        <motion.line
          key={`e-${i}`}
          x1={NODES[a].x}
          y1={NODES[a].y}
          x2={NODES[b].x}
          y2={NODES[b].y}
          stroke="currentColor"
          strokeWidth="1"
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: "easeOut" }}
        />
      ))}
      {NODES.map((node, i) => (
        <g key={`n-${i}`}>
          {node.pulse && animate && (
            <motion.circle
              cx={node.x}
              cy={node.y}
              fill="none"
              stroke={node.color}
              strokeWidth="1"
              initial={{ r: node.r, opacity: 0 }}
              animate={{ r: node.r + 11, opacity: [0, 0.5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: 1, ease: "easeOut" }}
            />
          )}
          <motion.circle
            cx={node.x}
            cy={node.y}
            fill={node.color}
            initial={animate ? { r: 0, opacity: 0 } : { r: node.r, opacity: 1 }}
            animate={
              animate
                ? { r: [node.r, node.r * 1.18, node.r], opacity: 1 }
                : undefined
            }
            transition={{
              r: { duration: 3 + (i % 3), repeat: Infinity, delay: 0.3 + i * 0.06, ease: "easeInOut" },
              opacity: { duration: 0.4, delay: 0.3 + i * 0.06 },
            }}
          />
        </g>
      ))}
    </motion.svg>
  );
}

function SeveredEdge({ animate }: { animate: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 120 40"
      className="w-28 text-muted-foreground"
      aria-hidden="true"
      initial={animate ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <line x1="25" y1="20" x2="52" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
      <line x1="66" y1="24" x2="94" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.35" />
      <circle cx="18" cy="20" r="5" fill="var(--chart-3)" />
      <circle cx="101" cy="22" r="5" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.6" />
    </motion.svg>
  );
}

export function SearchEmptyState({ variant, query, onSeedSelect }: SearchEmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const seeds = useMemo(
    () => [
      ...pickRandom(SEED_POOL.genre, 2),
      ...pickRandom(SEED_POOL.artist, 2),
    ],
    []
  );

  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <SeveredEdge animate={animate} />
        <p className="text-sm font-medium text-foreground">
          Nothing echoes back for <span className="text-muted-foreground">&ldquo;{query}&rdquo;</span>
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Search forgives a typo or two — try fewer letters, or wander in from a genre instead.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <Constellation animate={animate} />
      <motion.span
        className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        Rhizome search
      </motion.span>
      <motion.p
        className="text-base font-medium tracking-tight text-foreground"
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
      >
        Start anywhere
      </motion.p>
      <motion.p
        className="text-xs text-muted-foreground"
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
      >
        Type an artist or genre — the map unfolds from there.
      </motion.p>
      {onSeedSelect && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {seeds.map((seed, i) => (
            <motion.button
              key={seed}
              type="button"
              onClick={() => onSeedSelect(seed)}
              className="flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-accent hover:text-foreground"
              initial={animate ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.8 + i * 0.07, ease: "easeOut" }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: `var(--chart-${(i % 5) + 1})` }}
              />
              {seed}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
