import { Artist, NodeLink } from '@/types';
import { CLUSTER_COLORS } from '@/constants';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

export type ClusteringMethod = 'genre' | 'tags' | 'louvain' | 'hybrid';

export interface ClusterResult {
  method: ClusteringMethod;
  clusters: Map<string, Cluster>;
  artistToCluster: Map<string, string>; // artistId -> clusterId
  links?: Array<{ source: string; target: string; weight: number }>; // Links used for clustering
  stats: {
    clusterCount: number;
    avgClusterSize: number;
    largestCluster: number;
  };
}

export interface Cluster {
  id: string;
  name: string;
  artistIds: string[];
  color: string;
  centroid?: { x: number; y: number }; // For visualization
}

export interface ClusteringOptions {
  method: ClusteringMethod;
  tagSimilarityThreshold?: number;
  resolution?: number;  // For Louvain
  hybridWeights?: {
    genre: number;
    tags: number;
    louvain: number;
  };
}

export class ClusteringEngine {
  private artists: Artist[];
  private artistLinks: NodeLink[];
  private allTags: string[];
  private tagIndexMap: Map<string, number>;
  private artistNameToId: Map<string, string>;

  constructor(artists: Artist[], artistLinks: NodeLink[]) {
    this.artists = artists;
    this.artistLinks = artistLinks;
    this.artistNameToId = new Map(artists.map(a => [a.name, a.id]));
    this.allTags = this.extractAllTags();
    // Build tag index map for O(1) lookups instead of O(m) indexOf
    this.tagIndexMap = new Map(this.allTags.map((tag, idx) => [tag, idx]));
  }

  private extractAllTags(): string[] {
    const tagSet = new Set<string>();
    this.artists.forEach(artist => {
      artist.tags?.forEach(tag => tagSet.add(tag.name));
    });
    return Array.from(tagSet);
  }

  cluster(options: ClusteringOptions): ClusterResult {
    switch (options.method) {
      case 'genre':
        return this.clusterByGenre(options.resolution || 1.0);
      case 'tags':
        return this.clusterByTags(options.resolution || 1.0);
      case 'louvain':
        return this.clusterByLouvain(options.resolution || 1.0);
      case 'hybrid':
        return this.clusterHybrid(options.resolution || 1.0, options.hybridWeights);
      default:
        return this.clusterByGenre(options.resolution || 1.0);
    }
  }

  // UNIFIED LOUVAIN-BASED CLUSTERING
  // All methods build weighted graphs and run Louvain community detection

  // 1. GENRE CLUSTERING - Louvain with genre-weighted edges
  private clusterByGenre(resolution: number): ClusterResult {
    // Calculate genre similarities (Jaccard coefficient)
    const genreSimilarities = this.calculateGenreSimilarities();

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(genreSimilarities);
    const communities = louvain(graph, { resolution, randomWalk: false });

    return this.formatLouvainClusters(communities, 'genre', genreSimilarities);
  }

  // 2. TAG CLUSTERING - Louvain with tag-weighted edges
  private clusterByTags(resolution: number): ClusterResult {
    // Calculate tag similarities (cosine distance)
    const tagSimilarities = this.calculateTagSimilarities();

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(tagSimilarities);
    const communities = louvain(graph, { resolution, randomWalk: false });

    return this.formatLouvainClusters(communities, 'tags', tagSimilarities);
  }

  private buildTagVectors(): Map<string, number[]> {
    const vectors = new Map<string, number[]>();

    this.artists.forEach(artist => {
      const vector = new Array(this.allTags.length).fill(0);

      artist.tags?.forEach(tag => {
        const idx = this.tagIndexMap.get(tag.name) ?? -1;
        if (idx !== -1) {
          vector[idx] = tag.count; // Weight by tag count
        }
      });

      vectors.set(artist.id, vector);
    });

    return vectors;
  }


  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  }

  // 3. NETWORK CLUSTERING - Louvain with existing network structure
  private clusterByLouvain(resolution: number): ClusterResult {
    // Use existing artist link network directly (unweighted)
    const graph = new Graph({ type: 'undirected' });

    // Add nodes
    this.artists.forEach(artist => {
      graph.addNode(artist.id);
    });

    // Add edges from links (unweighted - all edges have weight 1.0)
    this.artistLinks.forEach(link => {
      if (!graph.hasEdge(link.source, link.target)) {
        graph.addEdge(link.source, link.target);
      }
    });

    // Run Louvain community detection
    const communities = louvain(graph, { resolution, randomWalk: false });

    // Convert existing links to similarity map format
    const networkSim = this.calculateNetworkSimilarities();

    return this.formatLouvainClusters(communities, 'louvain', networkSim);
  }

  // 4. HYBRID CLUSTERING - Louvain with combined weighted edges
  private clusterHybrid(
    resolution: number,
    weights = { genre: 0.33, tags: 0.33, louvain: 0.34 }
  ): ClusterResult {
    // Calculate all similarity metrics
    const genreSim = this.calculateGenreSimilarities();
    const tagSim = this.calculateTagSimilarities();
    const networkSim = this.calculateNetworkSimilarities();

    // Combine with weights
    const combinedSim = new Map<string, number>();

    const addWeightedSim = (
      similarities: Map<string, number>,
      weight: number
    ) => {
      similarities.forEach((sim, key) => {
        const current = combinedSim.get(key) || 0;
        combinedSim.set(key, current + sim * weight);
      });
    };

    addWeightedSim(genreSim, weights.genre);
    addWeightedSim(tagSim, weights.tags);
    addWeightedSim(networkSim, weights.louvain);

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(combinedSim);
    const communities = louvain(graph, { resolution, randomWalk: false });

    return this.formatLouvainClusters(communities, 'hybrid', combinedSim);
  }

  // HELPER: Build weighted graph from similarity map
  private buildWeightedGraph(similarities: Map<string, number>): Graph {
    const graph = new Graph({ type: 'undirected' });

    // Add all artist nodes
    this.artists.forEach(artist => {
      graph.addNode(artist.id);
    });

    // Add weighted edges from similarities
    similarities.forEach((weight, key) => {
      const [source, target] = key.split('-');
      // Only add edge if both nodes exist in the graph and weight > 0
      if (graph.hasNode(source) && graph.hasNode(target) &&
          !graph.hasEdge(source, target) && weight > 0) {
        graph.addEdge(source, target, { weight });
      }
    });

    return graph;
  }

  // HELPER: Format Louvain output to ClusterResult
  private formatLouvainClusters(
    communities: Record<string, number>,
    method: ClusteringMethod,
    similarities: Map<string, number>
  ): ClusterResult {
    // Group artists by community ID
    const communityMap = new Map<number, string[]>();

    Object.entries(communities).forEach(([artistId, communityId]) => {
      if (!communityMap.has(communityId)) {
        communityMap.set(communityId, []);
      }
      communityMap.get(communityId)!.push(artistId);
    });

    // Convert to Cluster format
    const clusters = new Map<string, Cluster>();
    const artistToCluster = new Map<string, string>();

    communityMap.forEach((artistIds, communityId) => {
      const clusterId = `${method}-${communityId}`;

      clusters.set(clusterId, {
        id: clusterId,
        name: `${this.getClusterLabel(method)} ${communityId}`,
        artistIds,
        color: this.getColorForCluster(clusterId),
      });

      artistIds.forEach(artistId => {
        artistToCluster.set(artistId, clusterId);
      });
    });

    // Generate links from similarities (filter to only intra-community links)
    const links: Array<{ source: string; target: string; weight: number }> = [];
    similarities.forEach((weight, key) => {
      const [source, target] = key.split('-');
      const sourceCluster = artistToCluster.get(source);
      const targetCluster = artistToCluster.get(target);

      // Only include links within the same cluster
      if (sourceCluster && targetCluster && sourceCluster === targetCluster) {
        links.push({ source, target, weight });
      }
    });

    return {
      method,
      clusters,
      artistToCluster,
      links,
      stats: this.calculateStats(clusters),
    };
  }

  // HELPER: Get user-friendly cluster label
  private getClusterLabel(method: ClusteringMethod): string {
    switch (method) {
      case 'genre': return 'Genre Community';
      case 'tags': return 'Tag Community';
      case 'louvain': return 'Community';
      case 'hybrid': return 'Hybrid Community';
      default: return 'Community';
    }
  }

  // SIMILARITY CALCULATION METHODS

  private calculateGenreSimilarities(): Map<string, number> {
    const similarities = new Map<string, number>();

    for (let i = 0; i < this.artists.length; i++) {
      for (let j = i + 1; j < this.artists.length; j++) {
        const artistA = this.artists[i];
        const artistB = this.artists[j];

        const sharedGenres = artistA.genres?.filter(g =>
          artistB.genres?.includes(g)
        ).length || 0;

        if (sharedGenres > 0) {
          const totalGenres = new Set([
            ...(artistA.genres || []),
            ...(artistB.genres || [])
          ]).size;

          const similarity = sharedGenres / totalGenres; // Jaccard similarity
          similarities.set(`${artistA.id}-${artistB.id}`, similarity);
        }
      }
    }

    return similarities;
  }

  private calculateTagSimilarities(): Map<string, number> {
    const vectors = this.buildTagVectors();
    const similarities = new Map<string, number>();
    const artistIds = Array.from(vectors.keys());

    for (let i = 0; i < artistIds.length; i++) {
      for (let j = i + 1; j < artistIds.length; j++) {
        const sim = this.cosineSimilarity(
          vectors.get(artistIds[i])!,
          vectors.get(artistIds[j])!
        );

        if (sim > 0) {
          similarities.set(`${artistIds[i]}-${artistIds[j]}`, sim);
        }
      }
    }

    return similarities;
  }

  private calculateNetworkSimilarities(): Map<string, number> {
    // Convert network edges to similarity map (binary: connected = 1.0, not connected = 0)
    const similarities = new Map<string, number>();

    this.artistLinks.forEach(link => {
      const key = link.source < link.target
        ? `${link.source}-${link.target}`
        : `${link.target}-${link.source}`;
      similarities.set(key, 1.0);
    });

    return similarities;
  }

  // STATS AND UTILITIES

  private calculateStats(clusters: Map<string, Cluster>) {
    const sizes = Array.from(clusters.values()).map(c => c.artistIds.length);

    return {
      clusterCount: clusters.size,
      avgClusterSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      largestCluster: Math.max(...sizes),
    };
  }

  private getColorForCluster(clusterId: string): string {
    // Generate consistent colors based on cluster ID
    // Simple hash function for consistent color assignment
    const hash = clusterId.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );

    return CLUSTER_COLORS[hash % CLUSTER_COLORS.length];
  }
}
