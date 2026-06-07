import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Phantom network nodes — ring the periphery, leave center open for content
const BG_NODES = [
  { id: 0,  cx: 7,   cy: 16,  r: 2.6 },
  { id: 1,  cx: 20,  cy: 7,   r: 2.1 },
  { id: 2,  cx: 36,  cy: 11,  r: 3.3 },
  { id: 3,  cx: 54,  cy: 6,   r: 2.4 },
  { id: 4,  cx: 70,  cy: 12,  r: 1.8 },
  { id: 5,  cx: 82,  cy: 24,  r: 3.0 },
  { id: 6,  cx: 90,  cy: 42,  r: 2.2 },
  { id: 7,  cx: 88,  cy: 60,  r: 3.4 },
  { id: 8,  cx: 80,  cy: 75,  r: 2.3 },
  { id: 9,  cx: 66,  cy: 84,  r: 3.0 },
  { id: 10, cx: 50,  cy: 90,  r: 2.0 },
  { id: 11, cx: 34,  cy: 85,  r: 2.8 },
  { id: 12, cx: 18,  cy: 76,  r: 2.1 },
  { id: 13, cx: 9,   cy: 60,  r: 3.1 },
  { id: 14, cx: 6,   cy: 42,  r: 2.3 },
  // Mid-ring nodes (closer to center but not center itself)
  { id: 15, cx: 22,  cy: 28,  r: 1.9 },
  { id: 16, cx: 40,  cy: 22,  r: 2.5 },
  { id: 17, cx: 62,  cy: 24,  r: 2.0 },
  { id: 18, cx: 75,  cy: 38,  r: 2.6 },
  { id: 19, cx: 76,  cy: 58,  r: 2.1 },
  { id: 20, cx: 62,  cy: 72,  r: 2.8 },
  { id: 21, cx: 42,  cy: 76,  r: 2.0 },
  { id: 22, cx: 24,  cy: 65,  r: 2.4 },
  { id: 23, cx: 18,  cy: 46,  r: 1.9 },
];

const BG_LINKS = [
  // Outer ring
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 0],
  // Spokes inward
  [1, 15], [2, 16], [4, 17], [5, 18], [7, 19], [9, 20], [11, 21], [13, 22], [14, 23],
  // Inner connections
  [15, 16], [17, 18], [18, 19], [20, 21], [22, 23], [15, 23], [16, 17], [19, 20], [21, 22],
];

const DURATIONS = [4.6, 5.3, 4.9, 5.7, 4.3, 5.1, 4.7, 5.5, 4.4, 5.8];

export type GraphEmptyMode = 'collection-empty' | 'collection-filtered' | 'similar-artists' | 'genre-and-filter';

const COPY: Record<GraphEmptyMode, { headline: string; body: string; cta?: string }> = {
  'collection-empty': {
    headline: 'Your collection is empty',
    body: 'Search for artists and add them to see your taste mapped.',
    cta: 'Search artists',
  },
  'collection-filtered': {
    headline: 'No artists match',
    body: 'Try removing some genre or decade filters.',
  },
  'similar-artists': {
    headline: 'No similar artists found',
    body: "Not enough data to map this artist's connections.",
  },
  'genre-and-filter': {
    headline: 'No artists match all genres',
    body: "No artists are tagged with every selected genre. Try switching to 'any'.",
  },
};

interface GraphEmptyStateProps {
  mode: GraphEmptyMode;
  onSearch?: () => void;
}

export function GraphEmptyState({ mode, onSearch }: GraphEmptyStateProps) {
  const { headline, body, cta } = COPY[mode];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 5 }}
    >
      {/* Animated phantom graph */}
      <svg
        className="absolute inset-0 w-full h-full text-foreground"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <style>{`
          @keyframes ghost-dim {
            0%, 100% { opacity: 0.025; }
            50% { opacity: 0.065; }
          }
          @keyframes ghost-mid {
            0%, 100% { opacity: 0.045; }
            50% { opacity: 0.11; }
          }
          @keyframes ghost-link {
            0%, 100% { opacity: 0.02; }
            50% { opacity: 0.05; }
          }
        `}</style>

        {BG_LINKS.map(([a, b], i) => {
          const na = BG_NODES[a], nb = BG_NODES[b];
          const dur = DURATIONS[i % DURATIONS.length];
          const delay = (i * 0.19) % 3.5;
          return (
            <line
              key={i}
              x1={na.cx} y1={na.cy}
              x2={nb.cx} y2={nb.cy}
              stroke="currentColor"
              strokeWidth="0.18"
              style={{ animation: `ghost-link ${dur}s ease-in-out ${delay}s infinite` }}
            />
          );
        })}

        {BG_NODES.map((n, i) => {
          const isOuter = n.cx < 22 || n.cx > 78 || n.cy < 18 || n.cy > 82;
          const dur = DURATIONS[i % DURATIONS.length];
          const delay = (i * 0.28) % 4.5;
          return (
            <circle
              key={n.id}
              cx={n.cx} cy={n.cy} r={n.r}
              fill="currentColor"
              style={{ animation: `${isOuter ? 'ghost-dim' : 'ghost-mid'} ${dur}s ease-in-out ${delay}s infinite` }}
            />
          );
        })}
      </svg>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
        className="relative flex flex-col items-center gap-4 text-center pointer-events-auto px-6"
        style={{ maxWidth: 268, zIndex: 1 }}
      >
        {/* Constellation icon */}
        <svg
          width="30" height="30"
          viewBox="0 0 46 46"
          fill="none"
          className="text-foreground opacity-[0.18]"
        >
          <circle cx="23" cy="9"  r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8"  cy="37" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="38" cy="37" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="23"  y1="14.5" x2="8"  y2="31.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="23"  y1="14.5" x2="38" y2="31.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="13.5" y1="37" x2="32.5" y2="37"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
