import { Artist, NodeLink } from '@/types';
import { CLUSTER_COLORS, ARTIST_LISTENER_TIERS, ListenerTier } from '@/constants';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import { buildNormalizedLocationMap, calculateLocationSimilarity } from './locationNormalization';

export type ClusteringMethod = 'louvain' | 'hybrid' | 'listeners';

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
  resolution?: number;  // For Louvain
  hybridWeights?: {
    vectors: number;
    louvain: number;
    location: number;  // Weight for location-based similarity (default: 0.2)
  };
  kNeighbors?: number;  // Number of nearest neighbors to keep (default: 20)
  minSimilarity?: number;  // Minimum similarity threshold (0-1, default: 0.1)
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
    
    switch (options.method) {
      case 'louvain':
        return this.clusterByLouvain(options.resolution || 1.0);
      case 'hybrid':
        return this.clusterHybrid(options.resolution || 1.0, options.hybridWeights, kNeighbors, minSimilarity);
      case 'listeners':
        return this.clusterByListeners();
      default:
        return this.clusterByLouvain(options.resolution || 1.0);
    }
  }

  // UNIFIED LOUVAIN-BASED CLUSTERING
  // All methods build weighted graphs and run Louvain community detection

  // 1. VECTOR SIMILARITY - Build cosine similarity from artist vectors
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

  // 2. NETWORK CLUSTERING - Louvain with existing network structure
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

  // 3. HYBRID CLUSTERING - Louvain with combined weighted edges
  private clusterHybrid(
    resolution: number,
    weights = { vectors: 0.6, louvain: 0.4, location: 0.3 },
    kNeighbors: number = 15,
    minSimilarity: number = 0.2
  ): ClusterResult {
    // Normalize vector/louvain weights to sum to 1.0 (location is a separate multiplier)
    const baseTotal = weights.vectors + weights.louvain;
    const normalizedWeights = {
      vectors: weights.vectors / baseTotal,
      louvain: weights.louvain / baseTotal,
    };

    // Location weight acts as a penalty strength (0 = no penalty, 1 = full penalty)
    // Clamp between 0 and 1
    const locationPenaltyStrength = Math.max(0, Math.min(1, weights.location));

    // Calculate vector similarity + network similarity
    const vectorSim = this.calculateTagSimilarities(kNeighbors, minSimilarity, false);
    const networkSim = this.calculateNetworkSimilarities();

    // Build location map for penalty calculation
    const locationMap = buildNormalizedLocationMap(this.artists);

    // Combine vector + network similarities
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

    addWeightedSim(vectorSim, normalizedWeights.vectors);
    addWeightedSim(networkSim, normalizedWeights.louvain);

    // Apply location penalty: scale down connections between geographically distant artists
    // Same country = 1.0 (no penalty), same region = 0.7, different/unknown = 0.4
    const penalizedSim = new Map<string, number>();
    let penaltyStats = { same: 0, region: 0, different: 0 };

    combinedSim.forEach((sim, key) => {
      const [sourceId, targetId] = key.split('|');
      const locA = locationMap.get(sourceId);
      const locB = locationMap.get(targetId);

      let multiplier = 1.0;
      if (locA && locB) {
        const locSim = calculateLocationSimilarity(locA, locB);
        if (locSim === 1.0) {
          // Same country - no penalty
          multiplier = 1.0;
          penaltyStats.same++;
        } else if (locSim === 0.5) {
          // Same region - mild penalty
          multiplier = 1.0 - (locationPenaltyStrength * 0.3);
          penaltyStats.region++;
        } else {
          // Different regions - stronger penalty
          multiplier = 1.0 - (locationPenaltyStrength * 0.6);
          penaltyStats.different++;
        }
      }
      // If either location is unknown, no penalty applied (multiplier stays 1.0)

      penalizedSim.set(key, sim * multiplier);
    });

    console.log(`[hybrid] Combined similarities: vectors=${vectorSim.size}, network=${networkSim.size}`);
    console.log(`[hybrid] Location penalties applied: same=${penaltyStats.same}, region=${penaltyStats.region}, different=${penaltyStats.different}`);

    // Filter out weak similarities to reduce graph complexity
    // After location penalty, more edges will fall below threshold
    const filteredCombinedSim = new Map<string, number>();
    const artistCount = this.artists.length;
    const minCombinedWeight = Math.max(
      minSimilarity * normalizedWeights.vectors,
      artistCount > 1000 ? 0.15 : 0.12
    );
    penalizedSim.forEach((weight, key) => {
      if (weight >= minCombinedWeight) {
        filteredCombinedSim.set(key, weight);
      }
    });

    console.log(`[hybrid] Filtered from ${penalizedSim.size} to ${filteredCombinedSim.size} edges (min weight: ${minCombinedWeight.toFixed(3)})`);

    // Ensure each artist has at least one edge in the hybrid graph.
    const degreeByArtist = new Map<string, number>();
    this.artists.forEach(artist => {
      degreeByArtist.set(artist.id, 0);
    });
    const bumpDegree = (id: string) => {
      degreeByArtist.set(id, (degreeByArtist.get(id) ?? 0) + 1);
    };
    filteredCombinedSim.forEach((_weight, key) => {
      const [source, target] = key.split('|');
      bumpDegree(source);
      bumpDegree(target);
    });

    const bestEdgeByArtist = new Map<string, { neighborId: string; weight: number }>();
    const updateBestEdge = (artistId: string, neighborId: string, weight: number) => {
      const existing = bestEdgeByArtist.get(artistId);
      if (!existing || weight > existing.weight) {
        bestEdgeByArtist.set(artistId, { neighborId, weight });
      }
    };
    penalizedSim.forEach((weight, key) => {
      const [source, target] = key.split('|');
      updateBestEdge(source, target, weight);
      updateBestEdge(target, source, weight);
    });

    const isolatedArtistIds = this.artists
      .map(artist => artist.id)
      .filter(id => (degreeByArtist.get(id) ?? 0) === 0);

    if (isolatedArtistIds.length > 0) {
      const vectors = this.buildTagVectors();
      const vectorIds = Array.from(vectors.keys());

      isolatedArtistIds.forEach(artistId => {
        if ((degreeByArtist.get(artistId) ?? 0) > 0) return;

        let fallback = bestEdgeByArtist.get(artistId);

        if (!fallback) {
          const vectorA = vectors.get(artistId);
          if (vectorA) {
            let bestSim = -1;
            let bestId: string | null = null;

            for (let i = 0; i < vectorIds.length; i++) {
              const otherId = vectorIds[i];
              if (otherId === artistId) continue;
              const vectorB = vectors.get(otherId);
              if (!vectorB) continue;
              const sim = this.cosineSimilarity(vectorA, vectorB);
              if (sim > bestSim) {
                bestSim = sim;
                bestId = otherId;
              }
            }

            if (bestId) {
              fallback = { neighborId: bestId, weight: bestSim * weights.vectors };
            }
          }
        }

        if (fallback) {
          const source = artistId < fallback.neighborId ? artistId : fallback.neighborId;
          const target = artistId < fallback.neighborId ? fallback.neighborId : artistId;
          const key = `${source}|${target}`;
          if (!filteredCombinedSim.has(key)) {
            const enforcedWeight = Math.max(fallback.weight, minCombinedWeight);
            filteredCombinedSim.set(key, enforcedWeight);
            bumpDegree(source);
            bumpDegree(target);
          }
        }
      });
    }

    // Build weighted graph and run Louvain
    const graph = this.buildWeightedGraph(filteredCombinedSim);
    const communities = louvain(graph, { resolution, randomWalk: false });

    // Reuse artistCount from above
    return this.formatLouvainClusters(communities, 'hybrid', filteredCombinedSim, minCombinedWeight);
  }

  // 4. LISTENERS CLUSTERING - Dynamic percentile-based popularity tiers
  private clusterByListeners(): ClusterResult {
    const clusters = new Map<string, Cluster>();
    const artistToCluster = new Map<string, string>();
    const nodeToTier = new Map<string, number>();

    // Build dynamic tiers based on actual listener distribution
    const dynamicTiers = this.buildDynamicListenerTiers();

    // Initialize clusters for each tier
    dynamicTiers.forEach(tier => {
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
      // Find tier where listeners falls within range (tiers are sorted high-to-low by id)
      const tier = dynamicTiers.find(t => listeners >= t.min && listeners < t.max) || dynamicTiers[dynamicTiers.length - 1];

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

    console.log(`[listeners] Assigned ${this.artists.length} artists to ${clusters.size} dynamic popularity tiers`);

    return {
      method: 'listeners',
      clusters,
      artistToCluster,
      links: [], // No relationship-based links for tier clustering
      stats: this.calculateStats(clusters),
      tierData: {
        nodeToTier,
        tiers: dynamicTiers,
      },
    };
  }

  // Build dynamic tiers based on percentiles of actual listener data
  private buildDynamicListenerTiers(): ListenerTier[] {
    const TIER_COUNT = 5;

    // Tier colors and radii (from most popular to least)
    const TIER_CONFIG = [
      { color: '#facc15', radius: 100 },  // yellow-400 - Mainstream
      { color: '#4ade80', radius: 250 },  // green-400 - Popular
      { color: '#38bdf8', radius: 400 },  // sky-400 - Established
      { color: '#c084fc', radius: 550 },  // purple-400 - Emerging
      { color: '#fb7185', radius: 700 },  // rose-400 - Underground
    ];

    // Sort artists by listeners ascending
    const sorted = [...this.artists]
      .map(a => a.listeners || 0)
      .sort((a, b) => a - b);

    if (sorted.length === 0) {
      // Return default tiers if no artists
      return ARTIST_LISTENER_TIERS;
    }

    const tierSize = Math.ceil(sorted.length / TIER_COUNT);
    const tiers: ListenerTier[] = [];

    for (let i = 0; i < TIER_COUNT; i++) {
      const startIdx = i * tierSize;
      const endIdx = Math.min((i + 1) * tierSize - 1, sorted.length - 1);

      // Skip if we've run out of artists
      if (startIdx >= sorted.length) break;

      const min = sorted[startIdx];
      const max = i === TIER_COUNT - 1 ? Infinity : sorted[endIdx];
      const tierId = TIER_COUNT - i; // Reverse so tier 5 = most popular
      const config = TIER_CONFIG[TIER_COUNT - 1 - i];

      tiers.push({
        id: tierId,
        name: `${this.formatListenerCount(min)} – ${this.formatListenerCount(max)}`,
        min,
        max: max === Infinity ? Infinity : max + 1,
        radius: config.radius,
        color: config.color,
      });
    }

    // Sort tiers by id descending (most popular first) for consistent lookup
    tiers.sort((a, b) => b.id - a.id);

    return tiers;
  }

  // Format listener count for display (e.g., 1500000 -> "1.5M")
  private formatListenerCount(count: number): string {
    if (count === Infinity) return '∞';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
    return count.toString();
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
      method === 'hybrid' && artistCount > 1000
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
      case 'louvain': return 'Community';
      case 'hybrid': return 'Hybrid Community';
      case 'listeners': return 'Popularity Tier';
      default: return 'Community';
    }
  }

  // SIMILARITY CALCULATION METHODS

  private calculateTagSimilarities(
    kNeighbors: number = 15,
    minSimilarity: number = 0.2,
    mutualOnly: boolean = true
  ): Map<string, number> {
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

    return this.buildKnnSimilarities(topKByArtist, mutualOnly);
  }

  private buildKnnSimilarities(
    topKByArtist: Map<string, Map<string, number>>,
    mutualOnly: boolean
  ): Map<string, number> {
    const similarities = new Map<string, number>();

    topKByArtist.forEach((neighborsA, artistAId) => {
      neighborsA.forEach((simA, artistBId) => {
        const neighborsB = topKByArtist.get(artistBId);
        const simB = neighborsB?.get(artistAId);
        if (mutualOnly && simB === undefined) return;

        const weight = simB !== undefined ? Math.min(simA, simB) : simA;
        const key = artistAId < artistBId
          ? `${artistAId}|${artistBId}`
          : `${artistBId}|${artistAId}`;

        const existing = similarities.get(key);
        if (existing === undefined || weight > existing) {
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
