import type { Artist, Tag } from '@/types';
import type { Cluster } from './ClusteringEngine';
import { serverUrl } from './utils';

function topTagsForArtists(artistIds: string[], artists: Artist[], count: number): string[] {
  const artistSet = new Set(artistIds);
  const tagScore = new Map<string, number>();

  artists.forEach(artist => {
    if (!artistSet.has(artist.id)) return;
    artist.tags?.forEach((tag: Tag) => {
      tagScore.set(tag.name, (tagScore.get(tag.name) ?? 0) + tag.count);
    });
  });

  return Array.from(tagScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name]) => name);
}

export async function labelClustersWithAI(
  clusters: Map<string, Cluster>,
  artists: Artist[]
): Promise<Map<string, string>> {
  const clusterEntries = Array.from(clusters.entries())
    .filter(([, c]) => c.artistIds.length > 0)
    .map(([id, cluster]) => {
      const tags = topTagsForArtists(cluster.artistIds, artists, 8);
      return { id, tags };
    });

  if (clusterEntries.length === 0) return new Map();

  const response = await fetch(`${serverUrl()}/ai/label-clusters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clusters: clusterEntries }),
  });

  if (!response.ok) throw new Error(`Cluster labeling failed: ${response.status}`);

  const data = await response.json();
  return new Map(Object.entries(data.labels));
}
