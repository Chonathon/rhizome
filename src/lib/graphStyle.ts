// Shared helpers for graph styling and label behavior

export const LABEL_FONT_SIZE = 16;
export const LABEL_FONT_MIN_PX = LABEL_FONT_SIZE * 0.75;
export const LABEL_FONT_MAX_PX = LABEL_FONT_SIZE * 2.1;
export const DEFAULT_LABEL_FADE_START = .1;
export const DEFAULT_LABEL_FADE_END = .5;
// Default upward screen-space offset (in px) to lift a focused node on mobile
export const DEFAULT_MOBILE_CENTER_OFFSET_PX = 140;

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

// Convert a screen-space pixel offset to world-space, given current zoom k
export function worldOffsetForScreenOffset(px: number, k: number): number {
  return px / Math.max(k || 1, 1e-6);
}

// Convenience: apply an upward drawer offset for mobile when centering
export function applyMobileDrawerYOffset(
  y: number,
  k: number,
  isMobile: boolean,
  offsetPx: number = DEFAULT_MOBILE_CENTER_OFFSET_PX
): number {
  if (!isMobile || !offsetPx) return y;
  return y + worldOffsetForScreenOffset(offsetPx, k);
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

export type LabelDrawOptions = {
  fontPx?: number;
  yOffsetPx?: number;
  globalScale?: number;
  minFontPx?: number;
  maxFontPx?: number;
  scaleWithZoom?: boolean;
  paddingPx?: number;
};

export function drawLabelBelow(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  r: number,
  theme: string | undefined,
  alpha = 1,
  options: LabelDrawOptions = {}
) {
  if (alpha <= 0) return;
  const {
    fontPx = LABEL_FONT_SIZE,
    yOffsetPx = 0,
    globalScale = 1,
    minFontPx = LABEL_FONT_MIN_PX,
    maxFontPx = LABEL_FONT_MAX_PX,
    scaleWithZoom = false,
    paddingPx = 8,
  } = options;

  const scale = Math.max(globalScale || 1, 1e-6);
  let screenFontPx = scaleWithZoom ? fontPx * scale : fontPx;
  screenFontPx = Math.min(maxFontPx, Math.max(minFontPx, screenFontPx));
  const fontWorldPx = screenFontPx / scale;
  const paddingWorld = paddingPx / scale;
  const yOffsetWorld = yOffsetPx / scale;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${fontWorldPx}px Geist`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  ctx.fillText(label, x, y + r + paddingWorld + yOffsetWorld);
  ctx.restore();
}
