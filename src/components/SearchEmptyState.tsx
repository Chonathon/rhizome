import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import axios from "axios";
import { CLUSTER_COLORS_DARK, CLUSTER_COLORS_LIGHT } from "@/lib/colors";
import { serverUrl } from "@/lib/utils";
import ArtistBadge from "@/components/ArtistBadge";
import GenreBadge from "@/components/GenreBadge";

interface SearchEmptyStateProps {
  variant: "idle" | "no-results";
  query?: string;
  onSeedSelect?: (seed: string) => void;
  getArtistImage?: (name: string) => string | undefined;
}

// Hue spread from the graph's cluster palette: red, yellow, teal, blue, purple
const PALETTE_PICKS = [0, 3, 7, 10, 13];

const usePaletteColors = () => {
  const { resolvedTheme } = useTheme();
  const base = resolvedTheme === "light" ? CLUSTER_COLORS_LIGHT : CLUSTER_COLORS_DARK;
  return PALETTE_PICKS.map((i) => base[i]);
};

// A miniature rhizome: node positions and edges for the idle-state constellation.
// `c` indexes into the palette colors above
const NODES = [
  { x: 30, y: 78, r: 4, c: 0 },
  { x: 74, y: 38, r: 5.5, c: 1 },
  { x: 128, y: 64, r: 7, c: 2, pulse: true },
  { x: 170, y: 26, r: 4, c: 3 },
  { x: 196, y: 84, r: 4.5, c: 4 },
  { x: 96, y: 102, r: 3, c: 0 },
  { x: 154, y: 104, r: 3.5, c: 3 },
  { x: 18, y: 28, r: 3, c: 1 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [2, 4], [1, 5], [2, 6], [7, 0], [3, 4],
];

// Quadratic bezier between two nodes, bowed perpendicular to the line.
// Alternating direction and varied amounts keep the curves looking hand-drawn
const edgePath = (a: { x: number; y: number }, b: { x: number; y: number }, i: number) => {
  const bow = (0.12 + (i % 3) * 0.05) * (i % 2 === 0 ? 1 : -1);
  const cx = (a.x + b.x) / 2 - (b.y - a.y) * bow;
  const cy = (a.y + b.y) / 2 + (b.x - a.x) * bow;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
};

const SEED_POOL = {
  genre: ["shoegaze", "krautrock", "dub techno", "ambient", "post-punk", "trip hop", "zeuhl", "bossa nova"],
  artist: ["Radiohead", "Aphex Twin", "Alice Coltrane", "Boards of Canada", "Fela Kuti", "Cocteau Twins", "Stereolab", "MF DOOM"],
};

const pickRandom = (pool: string[], count: number) =>
  [...pool].sort(() => Math.random() - 0.5).slice(0, count);

// Resolve images for artist seeds via the search endpoint, keyed by seed name.
// Local graph lookups rarely cover the random seeds, so this fills the gap
const useSeedImages = (names: string[]) => {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!names.length) return;
    const controller = new AbortController();
    const url = serverUrl();
    names.forEach(async (name) => {
      try {
        const response = await axios.get(`${url}/search/${encodeURIComponent(name)}`, {
          signal: controller.signal,
        });
        const match = (response.data as { name?: string; image?: string; artistCount?: number }[]).find(
          (item) =>
            !("artistCount" in item) &&
            item.name?.toLowerCase() === name.toLowerCase() &&
            typeof item.image === "string" &&
            item.image.trim() !== ""
        );
        if (match?.image) {
          setImages((prev) => ({ ...prev, [name]: match.image as string }));
        }
      } catch {
        // Chips fall back to the color dot; a failed image lookup isn't worth surfacing
      }
    });
    return () => controller.abort();
  }, [names]);

  return images;
};

function Constellation({ animate, colors }: { animate: boolean; colors: string[] }) {
  return (
    <motion.svg
      viewBox="0 0 214 120"
      className="w-52 text-muted-foreground"
      aria-hidden="true"
      animate={animate ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      {EDGES.map(([a, b], i) => (
        <motion.path
          key={`e-${i}`}
          d={edgePath(NODES[a], NODES[b], i)}
          fill="none"
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
              stroke={colors[node.c]}
              strokeWidth="1"
              initial={{ r: node.r, opacity: 0 }}
              animate={{ r: node.r + 11, opacity: [0, 0.5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: 1, ease: "easeOut" }}
            />
          )}
          <motion.circle
            cx={node.x}
            cy={node.y}
            fill={colors[node.c]}
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

// Spark ticks radiating from the break point
const SPARKS: [number, number, number, number][] = [
  [56, 16, 52, 9],
  [61, 14, 62, 7],
  [66, 18, 72, 14],
];

function SeveredEdge({ animate, color }: { animate: boolean; color: string }) {
  return (
    <motion.svg
      viewBox="0 0 120 44"
      className="w-32 text-muted-foreground"
      aria-hidden="true"
      initial={animate ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Two stubs recoiling from the break: ends curl away from each other */}
      <motion.path
        d="M 21 24 C 34 24 44 23 52 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="3 3"
        opacity="0.55"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      />
      <motion.path
        d="M 99 26 C 87 27 77 30 69 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="3 3"
        opacity="0.4"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      />
      {/* Snap burst at the break */}
      <g stroke={color} strokeWidth="1.5" strokeLinecap="round">
        {SPARKS.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={`s-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            initial={animate ? { opacity: 0, scale: 0.4 } : false}
            animate={{ opacity: [0, 1, 0.7], scale: 1 }}
            transition={{ duration: 0.35, delay: 0.5 + i * 0.06, ease: "easeOut" }}
            style={{ transformOrigin: "60px 17px" }}
          />
        ))}
      </g>
      <circle cx="14" cy="24" r="5" fill={color} />
      {/* The far node hangs hollow, knocked slightly off the line */}
      <circle cx="106" cy="27" r="5" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.6" />
    </motion.svg>
  );
}

export function SearchEmptyState({ variant, query, onSeedSelect, getArtistImage }: SearchEmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
  const colors = usePaletteColors();

  // Two marquee rows of four, genres and artists interleaved
  const seedRows = useMemo(() => {
    const genreSeeds = pickRandom(SEED_POOL.genre, 4).map((label) => ({ label, type: "genre" as const }));
    const artistSeeds = pickRandom(SEED_POOL.artist, 4).map((label) => ({ label, type: "artist" as const }));
    const interleaved = genreSeeds.flatMap((seed, i) => [seed, artistSeeds[i]]);
    return [interleaved.slice(0, 4), interleaved.slice(4)];
  }, []);
  const artistSeedNames = useMemo(
    () => (variant === "idle" ? seedRows.flat().filter((s) => s.type === "artist").map((s) => s.label) : []),
    [seedRows, variant]
  );
  const seedImages = useSeedImages(artistSeedNames);

  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center gap-1 px-6 py-8 text-center">
        <SeveredEdge animate={animate} color={colors[2]} />
        <p className="text-md font-medium text-foreground">
          Didn't find anything for <span className="text-muted-foreground">&ldquo;{query}&rdquo;</span>
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Search forgives a typo or two. Try fewer letters, or wander in from a genre instead.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <Constellation animate={animate} colors={colors} />
      <motion.p
        className="text-xl font-medium tracking-tight text-foreground"
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
      >
        Start anywhere
      </motion.p>
      <motion.p
        className="text-md text-muted-foreground"
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
      >
        Type an artist or genre and the map unfolds from there.
      </motion.p>
      {onSeedSelect && (
        <motion.div
          className="mt-4 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          initial={animate ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
        >
          {seedRows.map((row, rowIdx) => (
            <div key={rowIdx} className="group/marquee overflow-hidden py-1">
              <div
                className={
                  animate
                    ? "flex w-max gap-1.5 animate-[search-marquee_40s_linear_infinite] group-hover/marquee:[animation-play-state:paused]"
                    : "flex flex-wrap justify-center gap-1.5"
                }
                // Slightly different speeds keep the rows from moving in lockstep
                style={animate ? { animationDuration: rowIdx === 0 ? "45s" : "60s" } : undefined}
              >
                {(animate ? [...row, ...row] : row).map((seed, i) => {
                  const colorIdx = (rowIdx * 4 + (i % row.length)) % colors.length;
                  return (
                    <div key={`${seed.label}-${i}`}>
                      {seed.type === "genre" ? (
                        <GenreBadge
                          name={seed.label}
                          onClick={() => onSeedSelect(seed.label)}
                          genreColor={colors[colorIdx]}
                        />
                      ) : (
                        <ArtistBadge
                          name={seed.label}
                          onClick={() => onSeedSelect(seed.label)}
                          genreColor={colors[colorIdx]}
                          imageUrl={getArtistImage?.(seed.label) ?? seedImages[seed.label]}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
