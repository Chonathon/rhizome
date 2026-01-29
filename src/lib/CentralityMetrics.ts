/**
 * Graph centrality metrics and node selection utilities.
 * Provides degree/betweenness/eigenvector/PageRank calculations via graphology,
 * plus lightweight helpers for selecting "central" nodes (e.g., for priority labels).
 */

import Graph from 'graphology';
import { degree, betweennessCentrality, eigenvectorCentrality } from 'graphology-metrics/centrality';
import { pagerank } from 'graphology-metrics/centrality/pagerank';
import { Artist, NodeLink } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Link Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts a node ID from a link endpoint, which can be either a string ID
 * or a node object with an `id` property (force-graph libraries often resolve
 * link references to actual node objects after initialization).
 */
export function getLinkNodeId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: string }).id;
    return id ? String(id) : null;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Degree Centrality (Lightweight)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a map of node ID -> degree (number of connections).
 * Only counts links where both endpoints are in the allowedIds set,
 * ensuring we only consider connections within the visible/filtered graph.
 *
 * This is a lightweight alternative to the full graphology-based `calculateCentrality`
 * when you only need degree counts for a filtered subset of nodes.
 */
export function buildDegreeMap(links: NodeLink[], allowedIds: Set<string>): Map<string, number> {
  const degreeById = new Map<string, number>();
  links.forEach((link) => {
    const source = getLinkNodeId(link.source);
    const target = getLinkNodeId(link.target);
    if (!source || !target) return;
    if (!allowedIds.has(source) || !allowedIds.has(target)) return;
    // Increment degree for both endpoints of the link
    degreeById.set(source, (degreeById.get(source) ?? 0) + 1);
    degreeById.set(target, (degreeById.get(target) ?? 0) + 1);
  });
  return degreeById;
}

/**
 * Selects the top N% of nodes by degree (number of connections).
 * Uses a cutoff threshold so that ties at the boundary are included,
 * which may result in slightly more than the requested percentage.
 *
 * @param nodes - Array of nodes with `id` property
 * @param degreeById - Map of node ID -> degree (from buildDegreeMap)
 * @param percent - Fraction of nodes to select (0-1)
 * @returns Array of node IDs for the most connected nodes
 */
export function selectTopDegreeIds(
  nodes: { id: string }[],
  degreeById: Map<string, number>,
  percent: number,
): string[] {
  // Clamp percent to valid range [0, 1]
  const safePercent = Math.max(0, Math.min(1, percent));
  if (safePercent <= 0) return [];

  // Filter to nodes that have at least one connection
  const entries = nodes
    .map((node) => ({ id: node.id, degree: degreeById.get(node.id) ?? 0 }))
    .filter((entry) => entry.degree > 0);
  if (!entries.length) return [];

  // Calculate how many nodes we want (at least 1)
  const count = Math.max(1, Math.ceil(entries.length * safePercent));

  // Sort by degree descending and find the cutoff threshold
  const sorted = [...entries].sort((a, b) => b.degree - a.degree);
  const cutoff = sorted[Math.min(count - 1, sorted.length - 1)].degree;

  // Return all nodes that meet or exceed the cutoff (handles ties)
  return entries.filter((entry) => entry.degree >= cutoff).map((entry) => entry.id);
}

/**
 * High-level helper to get priority label IDs based on node centrality.
 * Combines buildDegreeMap + selectTopDegreeIds with optional hierarchy override.
 *
 * @param nodes - Array of nodes with `id` property
 * @param links - Array of links connecting nodes
 * @param percent - Fraction of nodes to select (0-1)
 * @param hierarchyRoots - Optional array of root IDs to use instead of degree-based selection
 * @returns Array of node IDs that should have priority labels
 */
export function getPriorityLabelIds(
  nodes: { id: string }[],
  links: NodeLink[],
  percent: number,
  hierarchyRoots?: string[],
): string[] {
  if (!nodes.length) return [];

  const nodeIds = new Set(nodes.map((node) => node.id));
  const degreeById = buildDegreeMap(links, nodeIds);

  // If hierarchy roots provided, use them (filtered to visible nodes with connections)
  if (hierarchyRoots && hierarchyRoots.length > 0) {
    return hierarchyRoots.filter(
      (id) => nodeIds.has(id) && (degreeById.get(id) ?? 0) > 0,
    );
  }

  // Default: select most connected nodes
  return selectTopDegreeIds(nodes, degreeById, percent);
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Centrality Analysis (graphology-based)
// ─────────────────────────────────────────────────────────────────────────────

export interface CentralityScores {
  degree: Map<string, number>;
  betweenness: Map<string, number>;
  eigenvector: Map<string, number>;
  pagerank: Map<string, number>;
}

export function calculateCentrality(
  artists: Artist[],
  links: NodeLink[]
): CentralityScores {
  // Build graph
  const graph = new Graph({ type: 'undirected' });

  // Add nodes
  artists.forEach(artist => {
    graph.addNode(artist.id);
  });

  // Add edges
  links.forEach(link => {
    if (!graph.hasEdge(link.source, link.target)) {
      graph.addEdge(link.source, link.target);
    }
  });

  // Calculate all centrality metrics
  const degreeScores = degree(graph);
  const betweennessScores = betweennessCentrality(graph);
  const eigenvectorScores = eigenvectorCentrality(graph);
  const pagerankScores = pagerank(graph);

  return {
    degree: new Map(Object.entries(degreeScores)),
    betweenness: new Map(Object.entries(betweennessScores)),
    eigenvector: new Map(Object.entries(eigenvectorScores)),
    pagerank: new Map(Object.entries(pagerankScores)),
  };
}
