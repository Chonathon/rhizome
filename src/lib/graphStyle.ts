// Shared helpers for graph styling and label behavior

export const LABEL_FONT_SIZE = 12;
export const DEFAULT_LABEL_FADE_START = .1;
export const DEFAULT_LABEL_FADE_END = .3;

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Compute label alpha based on zoom k between start and end thresholds
export function labelAlphaForZoom(
  k: number,
  start: number = DEFAULT_LABEL_FADE_START,
  end: number = DEFAULT_LABEL_FADE_END
): number {
  const denom = Math.max(1e-6, end - start);
  const t = Math.max(0, Math.min(1, (k - start) / denom));
  return smoothstep(t);
}

export function estimateLabelWidth(name: string, fontPx = LABEL_FONT_SIZE): number {
  return (name?.length || 0) * (fontPx * 0.6);
}

export function collideRadiusForNode(label: string, nodeRadius: number, padding = 8, fontPx = LABEL_FONT_SIZE): number {
  const w = estimateLabelWidth(label, fontPx);
  const h = fontPx;
  const halfDiag = Math.sqrt(w * w + h * h) / 2;
  return Math.max(nodeRadius + padding, halfDiag + padding);
}

export function drawCircleNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.fill();
  ctx.stroke();
}

export function drawLabelBelow(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  r: number,
  theme: string | undefined,
  alpha = 1,
  fontPx = LABEL_FONT_SIZE,
  yOffset = 0
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${fontPx}px Geist`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  ctx.fillText(label, x, y + r + 8 + yOffset);
  ctx.restore();
}

// --- Collection Indicators (non-color, non-size) ---

// Pattern styles available for overlay
export type PatternStyle = 'diagonal' | 'cross' | 'dots';

// Cache CanvasPattern per canvas+key for performance
const patternCache = new WeakMap<HTMLCanvasElement, Map<string, CanvasPattern>>();

function getPatternKey(style: PatternStyle, alpha: number, theme?: string) {
  return `${style}:${alpha}:${theme || 'default'}`;
}

// Create a small offscreen tile and draw the requested pattern
function makePatternTile(style: PatternStyle, alpha: number, theme?: string): HTMLCanvasElement {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const tile = document.createElement('canvas');
  const size = 8; // CSS pixels; will be scaled by DPR
  tile.width = size * dpr;
  tile.height = size * dpr;
  const tctx = tile.getContext('2d');
  if (!tctx) return tile;
  tctx.scale(dpr, dpr);

  // Use light/dark neutral for visibility without encoding color semantics
  const neutral = theme === 'dark' ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
  tctx.strokeStyle = neutral;
  tctx.fillStyle = neutral;
  tctx.lineWidth = 1;
  tctx.lineCap = 'butt';

  switch (style) {
    case 'diagonal': {
      // 45° hatch from corners
      tctx.beginPath();
      tctx.moveTo(0, size);
      tctx.lineTo(size, 0);
      tctx.stroke();
      // optional secondary line offset for density
      tctx.beginPath();
      tctx.moveTo(-size * 0.5, size);
      tctx.lineTo(size * 0.5, 0);
      tctx.stroke();
      break;
    }
    case 'cross': {
      // Cross-hatch: 45° and 135°
      tctx.beginPath();
      tctx.moveTo(0, size);
      tctx.lineTo(size, 0);
      tctx.stroke();
      tctx.beginPath();
      tctx.moveTo(0, 0);
      tctx.lineTo(size, size);
      tctx.stroke();
      break;
    }
    case 'dots': {
      tctx.beginPath();
      tctx.arc(size * 0.5, size * 0.5, 1, 0, 2 * Math.PI);
      tctx.fill();
      break;
    }
  }
  return tile;
}

// Get or build a CanvasPattern for the given canvas/context
export function getHatchPattern(
  ctx: CanvasRenderingContext2D,
  style: PatternStyle = 'diagonal',
  alpha = 0.16,
  theme?: string
): CanvasPattern | null {
  const cnv = ctx.canvas as HTMLCanvasElement | undefined;
  if (!cnv) return null;
  let byKey = patternCache.get(cnv);
  const key = getPatternKey(style, alpha, theme);
  if (!byKey) {
    byKey = new Map();
    patternCache.set(cnv, byKey);
  }
  const cached = byKey.get(key);
  if (cached) return cached;
  const tile = makePatternTile(style, alpha, theme);
  const pat = ctx.createPattern(tile, 'repeat');
  if (pat) byKey.set(key, pat);
  return pat;
}

// Draw a hatched overlay inside an existing circular node without changing its base color
export function drawHatchedCircleOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  theme?: string,
  style: PatternStyle = 'diagonal',
  alpha = 0.16,
  globalScale = 1,
  linePx = 2
) {
  r = Math.max(0.5, r);
  // Draw hatch/dots anchored to the node so it moves with it.
  // Avoids canvas-anchored tiling that appears to slide under the node.
  const neutral = theme === 'dark' ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
  const spacing = 8 / Math.max(1e-6, globalScale); // ~8px on-screen
  const lineW = linePx / Math.max(1e-6, globalScale);
  const L = r * Math.SQRT2 + spacing; // half-extent after 45° rotation

  ctx.save();
  // Clip to circle once
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.clip();

  ctx.translate(x, y);
  ctx.lineWidth = lineW;
  ctx.strokeStyle = neutral;
  ctx.fillStyle = neutral;

  if (style === 'diagonal' || style === 'cross') {
    // First pass: 45° hatch
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    for (let px = -L; px <= L; px += spacing) {
      ctx.moveTo(px, -L);
      ctx.lineTo(px, L);
    }
    ctx.stroke();
    ctx.restore();

    if (style === 'cross') {
      // Second pass: -45° hatch
      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      for (let px = -L; px <= L; px += spacing) {
        ctx.moveTo(px, -L);
        ctx.lineTo(px, L);
      }
      ctx.stroke();
      ctx.restore();
    }
  } else if (style === 'dots') {
    const dotR = 0.8 / Math.max(1e-6, globalScale);
    for (let yy = -r; yy <= r; yy += spacing) {
      for (let xx = -r; xx <= r; xx += spacing) {
        if (xx * xx + yy * yy <= r * r) {
          ctx.beginPath();
          ctx.arc(xx, yy, dotR, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }

  ctx.restore();
}

// Draw a subtle dashed ring on or just inside the node boundary
export function drawDashedRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  theme?: string,
  alpha = 0.55,
  dash: [number, number] = [3, 2],
  lineWidth = 1,
  globalScale = 1
) {
  ctx.save();
  const neutral = theme === 'dark' ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
  ctx.strokeStyle = neutral;
  // Keep on-screen thickness/dash consistent across zooms
  const scale = Math.max(1e-6, globalScale);
  ctx.setLineDash((dash as any).map((d: number) => d / scale));
  ctx.lineWidth = lineWidth / scale;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
