import { Artist, NodeLink } from '@/types';
import { CLUSTER_COLORS } from '@/constants';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

export type ClusteringMethod = 'genre' | 'tags' | 'louvain' | 'hybrid';

export interface ClusterResult {
  method: ClusteringMethod;
  clusters: Map<string, Cluster>;
  artistToCluster: Map<string, string>; // artistId -> clusterId
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
        return this.clusterByGenre();
      case 'tags':
        return this.clusterByTags(options.tagSimilarityThreshold || 0.3);
      case 'louvain':
        return this.clusterByLouvain(options.resolution || 1.0);
      case 'hybrid':
        return this.clusterHybrid(options.hybridWeights);
      default:
        return this.clusterByGenre();
    }
  }

  // 1. GENRE CLUSTERING
  private clusterByGenre(): ClusterResult {
    const clusters = new Map<string, Cluster>();
    const artistToCluster = new Map<string, string>();

    this.artists.forEach(artist => {
      // Primary genre is first in array
      const primaryGenreId = artist.genres?.[0];
      if (!primaryGenreId) return;

      if (!clusters.has(primaryGenreId)) {
        clusters.set(primaryGenreId, {
          id: primaryGenreId,
          name: `Genre ${primaryGenreId.slice(0, 8)}`,
          artistIds: [],
          color: this.getColorForCluster(primaryGenreId),
        });
      }

      clusters.get(primaryGenreId)!.artistIds.push(artist.id);
      artistToCluster.set(artist.id, primaryGenreId);
    });

    return {
      method: 'genre',
      clusters,
      artistToCluster,
      stats: this.calculateStats(clusters),
    };
  }

  // 2. TAG CLUSTERING
  private clusterByTags(threshold: number): ClusterResult {
    // Build tag vectors for similarity calculation
    const vectors = this.buildTagVectors();

    // Use simple agglomerative clustering
    const clusters = this.agglomerativeClustering(vectors, threshold);

    return {
      method: 'tags',
      clusters,
      artistToCluster: this.buildArtistToClusterMap(clusters),
      stats: this.calculateStats(clusters),
    };
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

  private agglomerativeClustering(
    vectors: Map<string, number[]>,
    threshold: number
  ): Map<string, Cluster> {
    // Start: each artist is its own cluster
    const clusters = new Map<string, Set<string>>();
    const artistIds = Array.from(vectors.keys());

    artistIds.forEach(id => {
      clusters.set(id, new Set([id]));
    });

    // Calculate all pairwise similarities
    const similarities: Array<{
      a: string;
      b: string;
      similarity: number;
    }> = [];

    for (let i = 0; i < artistIds.length; i++) {
      for (let j = i + 1; j < artistIds.length; j++) {
        const vecA = vectors.get(artistIds[i])!;
        const vecB = vectors.get(artistIds[j])!;
        const sim = this.cosineSimilarity(vecA, vecB);

        if (sim > threshold) {
          similarities.push({
            a: artistIds[i],
            b: artistIds[j],
            similarity: sim,
          });
        }
      }
    }

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Merge clusters
    const clusterMapping = new Map<string, string>(); // artistId -> clusterId
    artistIds.forEach(id => clusterMapping.set(id, id));

    similarities.forEach(({ a, b }) => {
      const clusterA = clusterMapping.get(a)!;
      const clusterB = clusterMapping.get(b)!;

      if (clusterA !== clusterB) {
        // Merge B into A
        const artistsInB = clusters.get(clusterB)!;
        artistsInB.forEach(artistId => {
          clusters.get(clusterA)!.add(artistId);
          clusterMapping.set(artistId, clusterA);
        });
        clusters.delete(clusterB);
      }
    });

    // Convert to final format
    return this.formatClusters(clusters, 'tag-cluster');
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

  // 3. LOUVAIN COMMUNITY DETECTION
  private clusterByLouvain(resolution: number = 1.0): ClusterResult {
    // Build graphology graph from artists and links
    const graph = new Graph({ type: 'undirected' });

    // Add nodes
    this.artists.forEach(artist => {
      graph.addNode(artist.id);
    });

    // Add edges from links
    this.artistLinks.forEach(link => {
      if (!graph.hasEdge(link.source, link.target)) {
        graph.addEdge(link.source, link.target);
      }
    });

    // Run Louvain community detection
    const communities = louvain(graph, {
      resolution,
      randomWalk: false
    });

    // Convert to ClusterResult format
    return this.formatLouvainClusters(communities);
  }

  private formatLouvainClusters(communities: Record<string, number>): ClusterResult {
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
      const clusterId = `louvain-${communityId}`;

      clusters.set(clusterId, {
        id: clusterId,
        name: `Community ${communityId}`,
        artistIds,
        color: this.getColorForCluster(clusterId),
      });

      artistIds.forEach(artistId => {
        artistToCluster.set(artistId, clusterId);
      });
    });

    return {
      method: 'louvain',
      clusters,
      artistToCluster,
      stats: this.calculateStats(clusters),
    };
  }

  private findConnectedComponents(
    adjacency: Map<string, Set<string>>
  ): Map<string, Cluster> {
    const visited = new Set<string>();
    const components: Set<string>[] = [];

    const dfs = (nodeId: string, component: Set<string>) => {
      visited.add(nodeId);
      component.add(nodeId);

      adjacency.get(nodeId)?.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          dfs(neighborId, component);
        }
      });
    };

    // Find all connected components
    adjacency.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        const component = new Set<string>();
        dfs(nodeId, component);
        components.push(component);
      }
    });

    return this.formatClusters(
      new Map(components.map((comp, idx) => [`similar-${idx}`, comp])),
      'similar-cluster'
    );
  }

  // 4. HYBRID CLUSTERING
  private clusterHybrid(weights = { genre: 0.3, tags: 0.4, louvain: 0.3 }): ClusterResult {
    // Get Louvain communities as base structure
    const louvainResult = this.clusterByLouvain(1.0);

    // Calculate genre and tag similarities for refinement
    const genreSim = this.calculateGenreSimilarities();
    const tagSim = this.calculateTagSimilarities();

    // Build combined similarity scores
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

    // Add Louvain structure as similarities
    const louvainSim = this.extractLouvainSimilarities(louvainResult);
    addWeightedSim(louvainSim, weights.louvain);

    // Build adjacency from combined similarities
    const adjacency = this.buildAdjacencyFromSimilarities(combinedSim, 0.4);

    // Cluster using connected components
    const clusters = this.findConnectedComponents(adjacency);

    return {
      method: 'hybrid',
      clusters,
      artistToCluster: this.buildArtistToClusterMap(clusters),
      stats: this.calculateStats(clusters),
    };
  }

  private extractLouvainSimilarities(louvainResult: ClusterResult): Map<string, number> {
    const similarities = new Map<string, number>();

    // Artists in same Louvain community have similarity of 1.0
    louvainResult.clusters.forEach(cluster => {
      const artistIds = cluster.artistIds;
      for (let i = 0; i < artistIds.length; i++) {
        for (let j = i + 1; j < artistIds.length; j++) {
          const key = artistIds[i] < artistIds[j]
            ? `${artistIds[i]}-${artistIds[j]}`
            : `${artistIds[j]}-${artistIds[i]}`;
          similarities.set(key, 1.0);
        }
      }
    });

    return similarities;
  }

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

  private buildAdjacencyFromSimilarities(
    similarities: Map<string, number>,
    threshold: number
  ): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();

    similarities.forEach((sim, key) => {
      if (sim >= threshold) {
        const [a, b] = key.split('-');

        if (!adjacency.has(a)) adjacency.set(a, new Set());
        if (!adjacency.has(b)) adjacency.set(b, new Set());

        adjacency.get(a)!.add(b);
        adjacency.get(b)!.add(a);
      }
    });

    return adjacency;
  }

  // HELPER METHODS
  private formatClusters(
    rawClusters: Map<string, Set<string>>,
    prefix: string
  ): Map<string, Cluster> {
    const formatted = new Map<string, Cluster>();
    let idx = 0;

    rawClusters.forEach((artistIds, clusterId) => {
      formatted.set(clusterId, {
        id: clusterId,
        name: `${prefix}-${idx}`,
        artistIds: Array.from(artistIds),
        color: this.getColorForCluster(clusterId),
      });
      idx++;
    });

    return formatted;
  }

  private buildArtistToClusterMap(
    clusters: Map<string, Cluster>
  ): Map<string, string> {
    const mapping = new Map<string, string>();

    clusters.forEach((cluster, clusterId) => {
      cluster.artistIds.forEach(artistId => {
        mapping.set(artistId, clusterId);
      });
    });

    return mapping;
  }

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
