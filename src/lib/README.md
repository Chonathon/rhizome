# Graph Algorithms Library

This module contains graph analysis algorithms for clustering artists and computing centrality metrics.

## Overview

```
Artist[] + NodeLink[]
        ↓
┌───────────────────────────────────────┐
│  ClusteringEngine                     │
│  - Vector similarity (Cosine)         │
│  - Network structure (Louvain)        │
│  - Hybrid (weighted combination)      │
│  - Popularity tiers (listeners)       │
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
| `louvain` | Network edges | Uses existing similar-artist links |
| `hybrid` | Weighted combination | Blends vector similarity with network links |
| `listeners` | Listener count thresholds | Groups artists into popularity tiers with radial layout |

### Listeners (Popularity Tiers)

Unlike other methods, `listeners` clustering uses percentile-based categorization rather than community detection. Artists are divided into 5 equal-sized tiers based on the **actual listener distribution** in the current view:

| Tier | Position | Radius |
|------|----------|--------|
| 5 (top 20%) | Most popular in view | 100 (center) |
| 4 | | 250 |
| 3 | | 400 |
| 2 | | 550 |
| 1 (bottom 20%) | Least popular in view | 700 (outer) |

**Dynamic Tiers**: Tier boundaries are calculated from percentiles of the current artist set. This ensures all 5 tiers are populated regardless of whether you're viewing underground artists (e.g., all <10K listeners) or mainstream artists (e.g., all >1M listeners). Tier names display the actual listener ranges (e.g., "50K – 120K").

The result includes `tierData` for radial positioning, which arranges artists in concentric rings by popularity (popular at center, underground at outer ring).

### Usage

```typescript
import { ClusteringEngine, ClusteringOptions } from '@/lib/ClusteringEngine';

const engine = new ClusteringEngine(artists, artistLinks);

const result = engine.cluster({
  method: 'hybrid',     // 'louvain' | 'hybrid' | 'listeners'
  resolution: 1.0,      // Louvain resolution (higher = more clusters)
  kNeighbors: 15,       // K-nearest neighbors to keep
  minSimilarity: 0.2,   // Minimum similarity threshold
});
```

### Interfaces

```typescript
interface ClusteringOptions {
  method: ClusteringMethod;
  resolution?: number;              // Louvain resolution parameter
  hybridWeights?: {                 // Only for 'hybrid' method
    vectors: number;
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
  // For 'listeners' method: tier metadata for Y-axis layout
  tierData?: {
    nodeToTier: Map<string, number>;  // nodeId -> tierId (1-5)
    tiers: ListenerTier[];
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

For `hybrid` methods on large graphs (>1000 artists), even more aggressive filtering is applied.

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
