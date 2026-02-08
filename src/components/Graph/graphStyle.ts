// Shared helpers for graph styling and label behavior

import { fixWikiImageURL } from "@/lib/utils";

// Image cache for canvas rendering
const imageCache = new Map<string, HTMLImageElement>();
const loadingImages = new Set<string>();
const failedImages = new Set<string>();
const imageLoadCallbacks = new Set<() => void>();
const imageLoadStartCallbacks = new Set<() => void>();

export function onImageLoad(callback: () => void): () => void {
  imageLoadCallbacks.add(callback);
  return () => imageLoadCallbacks.delete(callback);
}

export function onImageLoadStart(callback: () => void): () => void {
  imageLoadStartCallbacks.add(callback);
  return () => imageLoadStartCallbacks.delete(callback);
}

export function getOrLoadImage(rawUrl: string): HTMLImageElement | null {
  // Transform wiki URLs to loadable format
  const url = fixWikiImageURL(rawUrl);

  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  if (loadingImages.has(url)) {
    return null; // Still loading
  }
  loadingImages.add(url);
  // Notify listeners that an image started loading
  imageLoadStartCallbacks.forEach(cb => cb());
  const img = new Image();
  img.onload = () => {
    imageCache.set(url, img);
    loadingImages.delete(url);
    // Notify all listeners that an image loaded
    imageLoadCallbacks.forEach(cb => cb());
  };
  img.onerror = () => {
    loadingImages.delete(url);
    failedImages.add(url);
    // Notify listeners so UI can update to show fallback
    imageLoadCallbacks.forEach(cb => cb());
  };
  img.src = url;
  return null;
}

export function isImageLoading(rawUrl: string): boolean {
  const url = fixWikiImageURL(rawUrl);
  return loadingImages.has(url);
}

export function isImageFailed(rawUrl: string): boolean {
  const url = fixWikiImageURL(rawUrl);
  return failedImages.has(url);
}

export function hasLoadingImages(): boolean {
  return loadingImages.size > 0;
}

// Get pulsing opacity for loading state (matches Tailwind's pulse: 1 -> 0.5 -> 1 over 2s)
export function getPulseOpacity(): number {
  const t = (performance.now() % 2000) / 2000; // 0-1 over 2 seconds
  // Tailwind pulse: opacity 1 at 0% and 100%, opacity 0.5 at 50%
  return 0.75 + 0.25 * Math.cos(t * 2 * Math.PI);
}

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

/**
 * Draw a selected node with image (artist) or letter (genre) fill.
 * Returns true if image was drawn, false otherwise (caller should draw normal node).
 */
export function drawSelectedNodeFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  label: string,
  nodeColor: string,
  imageUrl?: string,
  theme?: string,
  isArtist = false
): boolean {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'rgba(0, 0, 0, .87)' : 'rgba(255, 255, 255, .87)';

  ctx.save();

  // Only show image fill if we have an image URL and it's loaded
  if (imageUrl) {
    const img = getOrLoadImage(imageUrl);
    if (img) {
      // Draw image clipped to circle with cover behavior (maintain aspect ratio)
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.clip();

      // Calculate cover dimensions (like CSS object-fit: cover)
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const targetSize = r * 2;
      const imgAspect = imgW / imgH;

      let srcX = 0, srcY = 0, srcW = imgW, srcH = imgH;
      if (imgAspect > 1) {
        // Image is wider than tall - crop horizontally
        srcW = imgH;
        srcX = (imgW - srcW) / 2;
      } else if (imgAspect < 1) {
        // Image is taller than wide - crop vertically
        srcH = imgW;
        srcY = (imgH - srcH) / 2;
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, x - r, y - r, targetSize, targetSize);
      ctx.restore();
      return true;
    }
  }

  // Check if image is currently loading
  const loading = imageUrl && isImageLoading(imageUrl);
  const failed = imageUrl && isImageFailed(imageUrl);

  // Apply pulsing opacity while image is loading
  if (loading) {
    ctx.globalAlpha = getPulseOpacity();
  }

  // Draw the node circle
  drawCircleNode(ctx, x, y, r, nodeColor);

  // Only show letter if: no imageUrl (genre) OR image failed to load
  // Don't show letter during loading - just the pulsing circle
  // Skip letter for small nodes (radius < 10) where text won't fit legibly
  const minRadiusForLetter = 10;
  if ((!imageUrl || failed) && r >= minRadiusForLetter) {
    const letter = isArtist ? label.charAt(0).toUpperCase() : label.charAt(0).toLowerCase();
    const fontSize = r * 1.2;
    ctx.font = `600 ${fontSize}px/1 Geist`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(letter, x, y);
  }

  ctx.restore();
  return false;
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
  customColor?: string,
  bold = false,
  showBackground = false
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${bold || showBackground ? '600 ' : ''}${fontPx}px Geist`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const isDark = theme === 'dark';
  const textY = y + r + 6 + yOffset + fontPx / 2;

  // Draw pill-shaped background for selected nodes
  if (showBackground) {
    const textMetrics = ctx.measureText(label);
    const paddingX = 8;
    const paddingY = 4;
    const pillWidth = textMetrics.width + paddingX * 2;
    const pillHeight = fontPx + paddingY * 2;
    const pillRadius = pillHeight / 2;

    ctx.fillStyle = isDark ? 'oklch(0.922 0 0)' : 'oklch(0.205 0 0)';
    ctx.beginPath();
    ctx.roundRect(x - pillWidth / 2, textY - pillHeight / 2, pillWidth, pillHeight, pillRadius);
    ctx.fill();
  } else {
    // Add subtle shadow for contrast against nodes and edges (only when no background)
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Invert text color when background is shown (pill uses primary color)
  const textColor = showBackground
    ? (isDark ? 'rgba(0, 0, 0, .87)' : 'rgba(255, 255, 255, .87)')
    : (isDark ? 'rgba(255, 255, 255, .87)' : 'rgba(0, 0, 0, .87)');
  ctx.fillStyle = customColor ?? textColor;
  ctx.fillText(label, x, textY);
  ctx.restore();
}
