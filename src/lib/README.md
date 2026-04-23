# Graph Algorithms (lib)

This folder holds the clustering and centrality logic used by the artists/genres graphs.

## What This Module Contains

- `ClusteringEngine.ts` - artist clustering methods (similarArtists, hybrid, popularity, genre).
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
- `hybrid`: weighted blend of tag-vector similarity + network links, with an optional location penalty. (Currently unused in the UI — replaced by `genre` for collection mode.)
- `popularity`: percentile-based listener tiers (used for radial layout in the UI).
- `genre`: deterministic assignment by root genre (Rock, Electronic, etc.). Requires `genreAssignments`, `genreColors`, and `genreNames` in `ClusteringOptions`. Intra-cluster links are generated from KNN tag-vector similarity (reuses hybrid's `calculateTagSimilarities`). Only surfaced in collection mode.

`popularity` returns `tierData` for concentric-ring layouts. `genre` requires pre-computed genre maps passed from App.tsx via `ClusteringOptions`.

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
