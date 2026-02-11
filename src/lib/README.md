# Graph Algorithms (lib)

This folder holds the clustering and centrality logic used by the artists/genres graphs.

## What This Module Contains

- `ClusteringEngine.ts` - artist clustering methods (similarArtists, hybrid, popularity).
- `CentralityMetrics.ts` - graph centrality + lightweight helpers for priority labels.
- `locationNormalization.ts` - normalizes location strings for clustering penalties.
- `fixedOrderedMap.ts` - small utility used by graph data handling.

## How It Fits Together

```
Artist[] + NodeLink[]
  -> ClusteringEngine
  -> ClusterResult (clusters, artistToCluster, links, stats, tierData?)

Artist[] + NodeLink[]
  -> CentralityMetrics
  -> CentralityScores + priority label IDs
```

## Clustering Methods (high level)

- `similarArtists`: Louvain community detection on the existing similar-artist network.
- `hybrid`: weighted blend of tag-vector similarity + network links, with an optional location penalty.
- `popularity`: percentile-based listener tiers (used for radial layout in the UI).

`popularity` returns `tierData` for concentric-ring layouts. `hybrid` uses normalized locations to penalize cross-region edges.

## Centrality

- Full metrics: degree, betweenness, eigenvector, PageRank.
- Lightweight helpers: build degree maps and select top-N% nodes for priority labels.

## Integration Points

- UI selection lives in `ClusteringPanel.tsx`.
- Clustering is executed in `App.tsx` via `ClusteringEngine`.
- Priority labels feed into the graph render logic for visibility.

## Dependencies

- `graphology`
- `graphology-communities-louvain`
- `graphology-metrics`
