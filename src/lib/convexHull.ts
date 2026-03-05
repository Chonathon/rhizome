/**
 * Convex hull utilities using the Jarvis March (Gift Wrapping) algorithm.
 * Also provides hull expansion, smooth path drawing, and point-in-polygon detection.
 */

type Point = [number, number];

/** Cross product of vectors OA and OB */
function cross(O: Point, A: Point, B: Point): number {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

/**
 * Computes the convex hull of a set of 2D points using the Andrew's monotone chain algorithm.
 * Returns points in counter-clockwise order, or null if fewer than 3 unique points.
 */
export function convexHull(points: Point[]): Point[] | null {
  const n = points.length;
  if (n < 3) return null;

  // Sort by x, then by y
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half (duplicates of first point of the other)
  lower.pop();
  upper.pop();

  const hull = [...lower, ...upper];
  return hull.length >= 3 ? hull : null;
}

/** Compute centroid of a polygon */
function centroid(points: Point[]): Point {
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p[0];
    cy += p[1];
  }
  return [cx / points.length, cy / points.length];
}

/**
 * Expands hull points outward from their centroid by a given padding amount (in graph units).
 */
export function expandHull(hull: Point[], padding: number): Point[] {
  const c = centroid(hull);
  return hull.map(([x, y]) => {
    const dx = x - c[0];
    const dy = y - c[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return [x + padding, y] as Point;
    return [x + (dx / dist) * padding, y + (dy / dist) * padding] as Point;
  });
}

/**
 * Creates a simple hull for 2 points (a capsule/rectangle approximation).
 */
export function hullForTwoPoints(p1: Point, p2: Point, padding: number): Point[] {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / len) * padding;
  const ny = (dx / len) * padding;
  return [
    [p1[0] + nx, p1[1] + ny],
    [p2[0] + nx, p2[1] + ny],
    [p2[0] - nx, p2[1] - ny],
    [p1[0] - nx, p1[1] - ny],
  ];
}

/**
 * Creates a simple circular hull for a single point.
 */
export function hullForOnePoint(p: Point, radius: number): Point[] {
  const steps = 8;
  return Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    return [p[0] + Math.cos(angle) * radius, p[1] + Math.sin(angle) * radius] as Point;
  });
}

/**
 * Draws a smooth closed path through a set of polygon points using quadratic bezier curves.
 * Each hull vertex becomes a control point, and the path passes through the midpoints of edges.
 */
export function drawSmoothHull(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 3) return;

  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  const first = mid(points[points.length - 1], points[0]);
  ctx.moveTo(first[0], first[1]);

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const midNext = mid(current, next);
    ctx.quadraticCurveTo(current[0], current[1], midNext[0], midNext[1]);
  }

  ctx.closePath();
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Compute the topmost point (min y) of a hull for label placement.
 */
export function hullTopPoint(hull: Point[]): Point {
  return hull.reduce((top, p) => (p[1] < top[1] ? p : top), hull[0]);
}

/**
 * Compute the centroid for label placement.
 */
export function hullCentroid(hull: Point[]): Point {
  return centroid(hull);
}
