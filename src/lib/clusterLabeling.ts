import type { Artist, Tag } from '@/types';
import type { Cluster } from './ClusteringEngine';

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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OpenAI API key configured');

  const clusterEntries = Array.from(clusters.entries())
    .filter(([, c]) => c.artistIds.length > 0)
    .map(([id, cluster]) => {
      const tags = topTagsForArtists(cluster.artistIds, artists, 8);
      return { id, tags };
    });

  if (clusterEntries.length === 0) return new Map();

  const clusterList = clusterEntries
    .map(({ id, tags }) => `"${id}": [${tags.join(', ')}]`)
    .join('\n');

  const prompt = `You are a music genre expert. Each entry below is a cluster of listeners grouped by their most common Last.fm tags. Give each cluster a concise name (1–3 words) that captures the musical subculture or sound scene — not just the genre name, but the vibe or scene if it fits.

Clusters (ID → top listener tags):
${clusterList}

Return only a JSON object mapping each cluster ID to its label. Example: {"id1": "Thrash Metal", "id2": "Ambient Drone"}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

  const data = await response.json();
  const labels: Record<string, string> = JSON.parse(data.choices[0].message.content);
  return new Map(Object.entries(labels));
}
