// Shared helpers for graph styling and label behavior

export const LABEL_FONT_SIZE = 12;
export const DEFAULT_LABEL_FADE_START = .1;
export const DEFAULT_LABEL_FADE_END = .3;
// Highest normalized label-value cutoff when zoomed out (0-1, higher = fewer labels)
export const DEFAULT_LABEL_IMPORTANCE_THRESHOLD = 1.2;
// Opacity curve exponent for more gradual label fades
export const DEFAULT_LABEL_FADE_EXPONENT = 1.4;
// Threshold curve exponent for delaying label visibility as you zoom in
export const DEFAULT_LABEL_THRESHOLD_EXPONENT = 2;
// Priority label cutoff for the top tier (0-1, lower = earlier visibility)
export const DEFAULT_PRIORITY_LABEL_IMPORTANCE_THRESHOLD = .9;
// Zoom threshold scale for priority labels (lower = appear earlier)
export const DEFAULT_PRIORITY_LABEL_ZOOM_SCALE = 0.6;
// Share of nodes treated as priority labels for early visibility
export const DEFAULT_PRIORITY_LABEL_PERCENT = 0.01;
// Default upward screen-space offset (in px) to lift a focused node on mobile
export const DEFAULT_MOBILE_CENTER_OFFSET_PX = 140;
// Default zoom levels
export const DEFAULT_DAG_ZOOM = 0.25;
export const DEFAULT_MOBILE_ZOOM = 0.12;
export const DEFAULT_DESKTOP_ZOOM = 0.14;
// Desktop drawer + sidebar offset constants for centering
export const DESKTOP_DRAWER_WIDTH_PX = 384; // max-w-sm
export const SIDEBAR_EXPANDED_WIDTH_PX = 224; // 14rem
export const SIDEBAR_COLLAPSED_WIDTH_PX = 56; // 3.5rem
export const DESKTOP_OFFSET_MAX_WIDTH_PX = 1800; // Disable X offset above this screen width

export function getDefaultGraphZoom(dagMode: boolean, isMobile: boolean): number {
    return dagMode ? DEFAULT_DAG_ZOOM : (isMobile ? DEFAULT_MOBILE_ZOOM : DEFAULT_DESKTOP_ZOOM);
}

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

export function applyLabelFadeCurve(
  alpha: number,
  exponent: number = DEFAULT_LABEL_FADE_EXPONENT
): number {
  const t = Math.max(0, Math.min(1, alpha));
  return Math.pow(t, exponent);
}

// Convert zoom-based alpha (0-1) into a normalized label-value threshold (0-1).
export function labelValueThresholdForZoom(
  zoomAlpha: number,
  maxThreshold: number = DEFAULT_LABEL_IMPORTANCE_THRESHOLD,
  exponent: number = DEFAULT_LABEL_THRESHOLD_EXPONENT
): number {
  const t = Math.max(0, Math.min(1, zoomAlpha));
  const curved = Math.pow(t, Math.max(1e-6, exponent));
  return maxThreshold * (1 - curved);
}

export function fontPxForZoom(baseFontPx: number, k: number): number {
  return baseFontPx / Math.max(k || 1, 1e-6);
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

// Apply leftward offset to viewport center so node appears rightward on screen (drawer + sidebar on left)
// Disabled on large screens (>1800px) where there's enough space without offset
export function applyDesktopDrawerXOffset(
  x: number,
  k: number,
  isDesktop: boolean,
  sidebarExpanded: boolean
): number {
  if (!isDesktop) return x;
  if (window.innerWidth > DESKTOP_OFFSET_MAX_WIDTH_PX) return x;
  const sidebarWidth = sidebarExpanded ? SIDEBAR_EXPANDED_WIDTH_PX : SIDEBAR_COLLAPSED_WIDTH_PX;
  const offsetPx = (DESKTOP_DRAWER_WIDTH_PX + sidebarWidth) / 2;
  return x - worldOffsetForScreenOffset(offsetPx, k);
}

export function estimateLabelWidth(name: string, fontPx = LABEL_FONT_SIZE): number {
  return (name?.length || 0) * (fontPx * 0.6);
}

/**
 * Calculate collision radius for physics simulation.
 *
 * Previously included label dimensions which caused physics jitter.
 *
 * @param _label - Node label (unused, kept for API compatibility)
 * @param nodeRadius - Visual radius of the node circle
 * @param padding - Extra spacing around node (default 8)
 * @param _fontPx - Font size (unused, kept for API compatibility)
 * @returns Collision radius for d3.forceCollide
 */
export function collideRadiusForNode(
  _label: string,
  nodeRadius: number,
  padding = 8,
  _fontPx = LABEL_FONT_SIZE
): number {
  return nodeRadius + padding;
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

// Default node radius bounds
export const DEFAULT_MIN_RADIUS = 3;
export const DEFAULT_MAX_RADIUS = 35;
// Exponent for node size scaling (higher = more dramatic size differences)
export const NODE_SIZE_EXPONENT = 2;

/**
 * Calculate node radius from a normalized value (0-1).
 * Uses exponential scaling for better visual separation between large and small nodes.
 *
 * @param t - Normalized value between 0 and 1
 * @param minRadius - Minimum node radius
 * @param maxRadius - Maximum node radius
 * @param exponent - Power curve exponent (higher = more dramatic differences)
 * @returns Calculated radius
 */
export function calculateNodeRadius(
  t: number,
  minRadius = DEFAULT_MIN_RADIUS,
  maxRadius = DEFAULT_MAX_RADIUS,
  exponent = NODE_SIZE_EXPONENT
): number {
  const tExp = Math.pow(t, exponent);
  return minRadius + tExp * (maxRadius - minRadius);
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
  yOffset = 0,
  customColor?: string
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${fontPx}px Geist`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = customColor ?? (theme === 'dark' ? 'rgba(255, 255, 255, .87)' : 'rgba(0, 0, 0, .87)');
  ctx.fillText(label, x, y + r + 8 + yOffset);
  ctx.restore();
}
