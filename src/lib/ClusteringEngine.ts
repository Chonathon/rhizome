import { Artist, NodeLink } from '@/types';
import { CLUSTER_COLORS, ARTIST_LISTENER_TIERS, ListenerTier } from '@/constants';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

export type ClusteringMethod = 'genre' | 'tags' | 'louvain' | 'hybrid' | 'listeners';

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
  // For listeners clustering: tier metadata for Y-axis layout
  tierData?: {
    nodeToTier: Map<string, number>; // nodeId -> tierId (1-5)
    tiers: ListenerTier[];
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
  kNeighbors?: number;  // Number of nearest neighbors to keep (default: 20)
  minSimilarity?: number;  // Minimum similarity threshold (0-1, default: 0.1)
  excludeGenres?: string[];  // Genres to exclude from Jaccard similarity (e.g., when filtering by genre)
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
    const artistCount = this.artists.length;
    
    // Aggressive optimizations for large graphs
    // For graphs > 1000 artists, use much more restrictive settings
    let kNeighbors: number;
    let minSimilarity: number;
    
    if (artistCount > 2000) {
      // Very large graphs: very aggressive filtering
      kNeighbors = options.kNeighbors ?? 8;
      minSimilarity = options.minSimilarity ?? 0.3;
    } else if (artistCount > 1000) {
      // Large graphs: aggressive filtering
      kNeighbors = options.kNeighbors ?? 8;
      minSimilarity = options.minSimilarity ?? 0.25;
    } else {
      // Smaller graphs: moderate filtering
      kNeighbors = options.kNeighbors ?? 15;
      minSimilarity = options.minSimilarity ?? 0.2;
    }
    
    // For tags and hybrid methods with large graphs, be even more aggressive
    if ((options.method === 'tags' || options.method === 'hybrid') && artistCount > 1000) {
      kNeighbors = Math.min(kNeighbors, 10);
      minSimilarity = Math.max(minSimilarity, 0.3);
    }
    
    const excludeGenres = options.excludeGenres || [];

    switch (options.method) {
      case 'genre':
        return this.clusterByGenre(options.resolution || 1.0, kNeighbors, minSimilarity, excludeGenres);
      case 'tags':
        return this.clusterByTags(options.resolution || 1.0, kNeighbors, minSimilarity);
      case 'louvain':
        return this.clusterByLouvain(options.resolution || 1.0);
      case 'hybrid':
        return this.clusterHybrid(options.resolution || 1.0, options.hybridWeights, kNeighbors, minSimilarity, excludeGenres);
      case 'listeners':
        return this.clusterByListeners();
      default:
        return this.clusterByGenre(options.resolution || 1.0, kNeighbors, minSimilarity, excludeGenres);
    }
  }

  // UNIFIED LOUVAIN-BASED CLUSTERING
  // All methods build weighted graphs and run Louvain community detection

  // 1. GENRE CLUSTERING - Louvain with genre-weighted edges
  private clusterByGenre(resolution: number, kNeighbors: number = 15, minSimilarity: number = 0.2, excludeGenres: string[] = []): ClusterResult {
    // Calculate genre similarities (Jaccard coefficient)
    const genreSimilarities = this.calculateGenreSimilarities(kNeighbors, minSimilarity, excludeGenres);

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(genreSimilarities);
    const communities = louvain(graph, { resolution, randomWalk: false });

    const artistCount = this.artists.length;
    const minLinkWeight = artistCount > 1000 ? 0.2 : 0.15;
    return this.formatLouvainClusters(communities, 'genre', genreSimilarities, minLinkWeight);
  }

  // 2. TAG CLUSTERING - Louvain with tag-weighted edges
  private clusterByTags(resolution: number, kNeighbors: number = 15, minSimilarity: number = 0.2): ClusterResult {
    // Calculate tag similarities (cosine distance)
    const tagSimilarities = this.calculateTagSimilarities(kNeighbors, minSimilarity);

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(tagSimilarities);
    const communities = louvain(graph, { resolution, randomWalk: false });

    const artistCount = this.artists.length;
    const minLinkWeight = artistCount > 1000 ? 0.25 : 0.2;
    return this.formatLouvainClusters(communities, 'tags', tagSimilarities, minLinkWeight);
  }

  private buildTagVectors(): Map<string, number[]> {
    const idfByIndex = this.calculateTagIdf();
    const vectors = new Map<string, number[]>();

    this.artists.forEach(artist => {
      const vector = new Array(this.allTags.length).fill(0);

      artist.tags?.forEach(tag => {
        const idx = this.tagIndexMap.get(tag.name) ?? -1;
        if (idx !== -1) {
          const tf = Math.log(1 + tag.count);
          vector[idx] = tf * idfByIndex[idx];
        }
      });

      vectors.set(artist.id, vector);
    });

    return vectors;
  }

  private calculateTagIdf(): number[] {
    const docFreq = new Array(this.allTags.length).fill(0);

    this.artists.forEach(artist => {
      const seen = new Set<number>();
      artist.tags?.forEach(tag => {
        const idx = this.tagIndexMap.get(tag.name) ?? -1;
        if (idx !== -1 && !seen.has(idx)) {
          docFreq[idx] += 1;
          seen.add(idx);
        }
      });
    });

    const totalDocs = Math.max(this.artists.length, 1);

    return docFreq.map(df => {
      const smoothed = (totalDocs + 1) / (df + 1);
      return Math.log(smoothed) + 1;
    });
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

    const artistCount = this.artists.length;
    const minLinkWeight = artistCount > 1000 ? 0.2 : 0.15;
    return this.formatLouvainClusters(communities, 'louvain', networkSim, minLinkWeight);
  }

  // 4. HYBRID CLUSTERING - Louvain with combined weighted edges
  private clusterHybrid(
    resolution: number,
    weights = { genre: 0.33, tags: 0.33, louvain: 0.34 },
    kNeighbors: number = 15,
    minSimilarity: number = 0.2,
    excludeGenres: string[] = []
  ): ClusterResult {
    // Calculate all similarity metrics
    const genreSim = this.calculateGenreSimilarities(kNeighbors, minSimilarity, excludeGenres);
    const tagSim = this.calculateTagSimilarities(kNeighbors, minSimilarity);
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

    // Filter out weak combined similarities to reduce graph complexity
    const filteredCombinedSim = new Map<string, number>();
    const artistCount = this.artists.length;
    const minCombinedWeight = artistCount > 1000 ? 0.25 : 0.2;  // Higher threshold for large graphs
    combinedSim.forEach((weight, key) => {
      if (weight >= minCombinedWeight) {
        filteredCombinedSim.set(key, weight);
      }
    });

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(filteredCombinedSim);
    const communities = louvain(graph, { resolution, randomWalk: false });

    // Reuse artistCount from above
    const minLinkWeight = artistCount > 1000 ? 0.25 : 0.2;
    return this.formatLouvainClusters(communities, 'hybrid', filteredCombinedSim, minLinkWeight);
  }

  // 5. LISTENERS CLUSTERING - Threshold-based popularity tiers
  private clusterByListeners(tiers: ListenerTier[] = ARTIST_LISTENER_TIERS): ClusterResult {
    const clusters = new Map<string, Cluster>();
    const artistToCluster = new Map<string, string>();
    const nodeToTier = new Map<string, number>();

    // Initialize clusters for each tier using explicit tier colors for visual distinction
    tiers.forEach(tier => {
      const clusterId = `listeners-${tier.id}`;
      clusters.set(clusterId, {
        id: clusterId,
        name: tier.name,
        artistIds: [],
        color: tier.color,
      });
    });

    // Assign each artist to a tier based on listener count
    this.artists.forEach(artist => {
      const listeners = artist.listeners || 0;
      const tier = tiers.find(t => listeners >= t.min && listeners < t.max) || tiers[0];

      const clusterId = `listeners-${tier.id}`;
      clusters.get(clusterId)!.artistIds.push(artist.id);
      artistToCluster.set(artist.id, clusterId);
      nodeToTier.set(artist.id, tier.id);
    });

    // Remove empty tiers
    clusters.forEach((cluster, id) => {
      if (cluster.artistIds.length === 0) {
        clusters.delete(id);
      }
    });

    console.log(`[listeners] Assigned ${this.artists.length} artists to ${clusters.size} popularity tiers`);

    return {
      method: 'listeners',
      clusters,
      artistToCluster,
      links: [], // No relationship-based links for tier clustering
      stats: this.calculateStats(clusters),
      tierData: {
        nodeToTier,
        tiers,
      },
    };
  }

  // HELPER: Build weighted graph from similarity map
  private buildWeightedGraph(similarities: Map<string, number>): Graph {
    const graph = new Graph({ type: 'undirected' });

    // Add all artist nodes
    this.artists.forEach(artist => {
      graph.addNode(artist.id);
    });

    // Add weighted edges from similarities
    let edgesAdded = 0;
    let skippedMissingNode = 0;
    let skippedZeroWeight = 0;

    similarities.forEach((weight, key) => {
      const [source, target] = key.split('|');

      if (!graph.hasNode(source) || !graph.hasNode(target)) {
        skippedMissingNode++;
        return;
      }

      if (weight <= 0) {
        skippedZeroWeight++;
        return;
      }

      if (!graph.hasEdge(source, target)) {
        graph.addEdge(source, target, { weight });
        edgesAdded++;
      }
    });

    // console.log(`[buildWeightedGraph] Nodes: ${graph.order}, Edges added: ${edgesAdded}, Skipped (missing node): ${skippedMissingNode}, Skipped (zero weight): ${skippedZeroWeight}`);

    return graph;
  }

  // HELPER: Format Louvain output to ClusterResult
  private formatLouvainClusters(
    communities: Record<string, number>,
    method: ClusteringMethod,
    similarities: Map<string, number>,
    minLinkWeightOverride?: number
  ): ClusterResult {
    // Group artists by community ID
    const communityMap = new Map<number, string[]>();

    Object.entries(communities).forEach(([artistId, communityId]) => {
      if (!communityMap.has(communityId)) {
        communityMap.set(communityId, []);
      }
      communityMap.get(communityId)!.push(artistId);
    });

    console.log(`[${method}] Found ${communityMap.size} communities, generating links...`);

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
    // Also apply a weight threshold to reduce link count for better performance
    const links: Array<{ source: string; target: string; weight: number }> = [];
    // Adaptive link weight threshold based on method and graph size
    const artistCount = this.artists.length;
    const minLinkWeight = minLinkWeightOverride ?? (
      (method === 'tags' || method === 'hybrid') && artistCount > 1000
        ? 0.25  // Higher threshold for expensive methods on large graphs
        : 0.2   // Standard threshold
    );

    similarities.forEach((weight, key) => {
      // Skip weak connections to reduce link count
      if (weight < minLinkWeight) return;
      
      const [source, target] = key.split('|');
      const sourceCluster = artistToCluster.get(source);
      const targetCluster = artistToCluster.get(target);

      // Only include links within the same cluster
      if (sourceCluster && targetCluster && sourceCluster === targetCluster) {
        links.push({ source, target, weight });
      }
    });

    console.log(`[${method}] Generated ${links.length} intra-community links (from ${similarities.size} similarities, min weight: ${minLinkWeight})`);

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
      case 'listeners': return 'Popularity Tier';
      default: return 'Community';
    }
  }

  // SIMILARITY CALCULATION METHODS

  private calculateGenreSimilarities(kNeighbors: number = 15, minSimilarity: number = 0.2, excludeGenres: string[] = []): Map<string, number> {
    const excludeSet = new Set(excludeGenres);
    const topKByArtist = new Map<string, Map<string, number>>();

    // For each artist, find their K most similar artists
    for (let i = 0; i < this.artists.length; i++) {
      const artistA = this.artists[i];
      const artistSimilarities: Array<{ id: string; similarity: number }> = [];

      // Filter out excluded genres (e.g., the genre being filtered on)
      const genresA = (artistA.genres || []).filter(g => !excludeSet.has(g));

      for (let j = 0; j < this.artists.length; j++) {
        if (i === j) continue;
        const artistB = this.artists[j];

        // Filter out excluded genres for artist B as well
        const genresB = (artistB.genres || []).filter(g => !excludeSet.has(g));

        const sharedGenres = genresA.filter(g => genresB.includes(g)).length;

        if (sharedGenres > 0) {
          const totalGenres = new Set([...genresA, ...genresB]).size;

          const similarity = sharedGenres / totalGenres; // Jaccard similarity

          // Only consider if above threshold
          if (similarity >= minSimilarity) {
            artistSimilarities.push({ id: artistB.id, similarity });
          }
        }
      }

      // Keep only top K most similar
      artistSimilarities.sort((a, b) => b.similarity - a.similarity);
      const topK = artistSimilarities.slice(0, kNeighbors);

      const neighborMap = new Map<string, number>();
      topK.forEach(({ id, similarity }) => {
        neighborMap.set(id, similarity);
      });
      topKByArtist.set(artistA.id, neighborMap);
    }

    const similarities = this.buildMutualKnnSimilarities(topKByArtist);

    // console.log(`[Genre] Calculated ${similarities.size} genre similarities (mutual k-NN with K=${kNeighbors}, min=${minSimilarity}, excluding ${excludeGenres.length} genres)`);
    return similarities;
  }

  private calculateTagSimilarities(kNeighbors: number = 15, minSimilarity: number = 0.2): Map<string, number> {
    const vectors = this.buildTagVectors();
    const artistIds = Array.from(vectors.keys());
    const topKByArtist = new Map<string, Map<string, number>>();

    // For each artist, find their K most similar artists
    for (let i = 0; i < artistIds.length; i++) {
      const artistAId = artistIds[i];
      const vectorA = vectors.get(artistAId)!;
      const artistSimilarities: Array<{ id: string; similarity: number }> = [];

      for (let j = 0; j < artistIds.length; j++) {
        if (i === j) continue;
        const artistBId = artistIds[j];
        const vectorB = vectors.get(artistBId)!;

        const sim = this.cosineSimilarity(vectorA, vectorB);

        // Only consider if above threshold
        if (sim >= minSimilarity) {
          artistSimilarities.push({ id: artistBId, similarity: sim });
        }
      }

      // Keep only top K most similar
      artistSimilarities.sort((a, b) => b.similarity - a.similarity);
      const topK = artistSimilarities.slice(0, kNeighbors);

      const neighborMap = new Map<string, number>();
      topK.forEach(({ id, similarity }) => {
        neighborMap.set(id, similarity);
      });
      topKByArtist.set(artistAId, neighborMap);
    }

    return this.buildMutualKnnSimilarities(topKByArtist);
  }

  private buildMutualKnnSimilarities(topKByArtist: Map<string, Map<string, number>>): Map<string, number> {
    const similarities = new Map<string, number>();

    topKByArtist.forEach((neighborsA, artistAId) => {
      neighborsA.forEach((simA, artistBId) => {
        const neighborsB = topKByArtist.get(artistBId);
        if (!neighborsB || !neighborsB.has(artistAId)) return;

        const simB = neighborsB.get(artistAId) ?? simA;
        const weight = Math.min(simA, simB);
        const key = artistAId < artistBId
          ? `${artistAId}|${artistBId}`
          : `${artistBId}|${artistAId}`;

        if (!similarities.has(key)) {
          similarities.set(key, weight);
        }
      });
    });

    return similarities;
  }

  private calculateNetworkSimilarities(): Map<string, number> {
    // Convert network edges to similarity map (binary: connected = 1.0, not connected = 0)
    const similarities = new Map<string, number>();

    this.artistLinks.forEach(link => {
      const key = link.source < link.target
        ? `${link.source}|${link.target}`
        : `${link.target}|${link.source}`;
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
