# Graph Algorithms Library

This module contains graph analysis algorithms for clustering artists and computing centrality metrics.

## Overview

```
Artist[] + NodeLink[]
        ↓
┌───────────────────────────────────────┐
│  ClusteringEngine                     │
│  - Genre similarity (Jaccard)         │
│  - Tag similarity (Cosine)            │
│  - Network structure (Louvain)        │
│  - Hybrid (weighted combination)      │
└───────────────────────────────────────┘
        ↓
ClusterResult { clusters, artistToCluster, links, stats }

Artist[] + NodeLink[]
        ↓
┌───────────────────────────────────────┐
│  CentralityMetrics                    │
│  - Degree                             │
│  - Betweenness                        │
│  - Eigenvector                        │
│  - PageRank                           │
└───────────────────────────────────────┘
        ↓
CentralityScores { degree, betweenness, eigenvector, pagerank }
```

## ClusteringEngine

Unified Louvain-based clustering with different similarity metrics.

### Clustering Methods

| Method | Similarity Metric | Description |
|--------|------------------|-------------|
| `genre` | Jaccard coefficient | Groups artists by shared genres |
| `tags` | Cosine similarity | Groups artists by Last.fm tag vectors |
| `louvain` | Network edges | Uses existing similar-artist links |
| `hybrid` | Weighted combination | Blends all three metrics |

### Usage

```typescript
import { ClusteringEngine, ClusteringOptions } from '@/lib/ClusteringEngine';

const engine = new ClusteringEngine(artists, artistLinks);

const result = engine.cluster({
  method: 'genre',      // 'genre' | 'tags' | 'louvain' | 'hybrid'
  resolution: 1.0,      // Louvain resolution (higher = more clusters)
  kNeighbors: 15,       // K-nearest neighbors to keep
  minSimilarity: 0.2,   // Minimum similarity threshold
});
```

### Interfaces

```typescript
interface ClusteringOptions {
  method: ClusteringMethod;
  tagSimilarityThreshold?: number;
  resolution?: number;              // Louvain resolution parameter
  hybridWeights?: {                 // Only for 'hybrid' method
    genre: number;
    tags: number;
    louvain: number;
  };
  kNeighbors?: number;              // Default: 15 (8-12 for large graphs)
  minSimilarity?: number;           // Default: 0.2 (0.25-0.3 for large graphs)
}

interface ClusterResult {
  method: ClusteringMethod;
  clusters: Map<string, Cluster>;
  artistToCluster: Map<string, string>;  // artistId -> clusterId
  links?: Array<{ source: string; target: string; weight: number }>;
  stats: {
    clusterCount: number;
    avgClusterSize: number;
    largestCluster: number;
  };
}

interface Cluster {
  id: string;
  name: string;
  artistIds: string[];
  color: string;
  centroid?: { x: number; y: number };
}
```

### Performance Optimizations

The engine automatically adjusts parameters for large graphs:

| Artist Count | kNeighbors | minSimilarity |
|-------------|------------|---------------|
| > 2000 | 8 | 0.30 |
| > 1000 | 12 | 0.25 |
| ≤ 1000 | 15 | 0.20 |

For `tags` and `hybrid` methods on large graphs (>1000 artists), even more aggressive filtering is applied.

### How It Works

1. **Similarity Calculation**: For each artist, compute similarity to all others using the chosen metric
2. **K-NN Filtering**: Keep only top-K most similar neighbors per artist
3. **Graph Building**: Create weighted graph from filtered similarities
4. **Community Detection**: Run Louvain algorithm to find clusters
5. **Link Generation**: Extract intra-community links above weight threshold

## CentralityMetrics

Computes graph centrality measures using graphology-metrics.

### Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Degree** | Number of connections | Find most connected artists |
| **Betweenness** | Bridge importance | Find artists connecting communities |
| **Eigenvector** | Connection quality | Find artists connected to important artists |
| **PageRank** | Recursive importance | Find influential artists |

### Usage

```typescript
import { calculateCentrality, CentralityScores } from '@/lib/CentralityMetrics';

const scores: CentralityScores = calculateCentrality(artists, links);

// Get top artists by PageRank
const topByPageRank = artists
  .sort((a, b) => (scores.pagerank.get(b.id) ?? 0) - (scores.pagerank.get(a.id) ?? 0))
  .slice(0, 10);
```

### Interface

```typescript
interface CentralityScores {
  degree: Map<string, number>;
  betweenness: Map<string, number>;
  eigenvector: Map<string, number>;
  pagerank: Map<string, number>;
}
```

## Dependencies

- `graphology` - Graph data structure
- `graphology-communities-louvain` - Louvain community detection
- `graphology-metrics` - Centrality algorithms

## Integration with UI

These algorithms integrate with:
- [ClusteringPanel.tsx](../components/ClusteringPanel.tsx) - UI for selecting clustering method and color mode
- [ArtistsForceGraph](../components/Graph/ArtistsForceGraph.tsx) - Renders clustered artists with colors
