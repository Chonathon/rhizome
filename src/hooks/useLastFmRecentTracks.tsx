import { useEffect, useState } from 'react';

export interface LastFmTrack {
  name: string;
  artist: string;
  album: string;
  timestamp: number;
  nowPlaying?: boolean;
  imageUrl?: string;
}

export function useLastFmRecentTracks(lfmUsername?: string, enabled = true, limit = 30) {
  const [tracks, setTracks] = useState<LastFmTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
    if (!lfmUsername || !enabled || !apiKey) {
      setTracks([]);
      return;
    }

    setLoading(true);
    setError(null);

    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(lfmUsername)}&api_key=${apiKey}&format=json&limit=${limit}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const raw: unknown[] = data?.recenttracks?.track ?? [];
        setTracks(
          raw
            .filter((t: any) => t?.name && t?.artist?.['#text'])
            .map((t: any) => ({
              name: t.name,
              artist: t.artist['#text'],
              album: t.album?.['#text'] ?? '',
              timestamp: t.date?.uts ? parseInt(t.date.uts, 10) * 1000 : Date.now(),
              nowPlaying: t['@attr']?.nowplaying === 'true',
              imageUrl: t.image?.find((img: any) => img.size === 'medium')?.['#text'] ?? undefined,
            }))
        );
      })
      .catch(() => setError('Failed to load Last.fm data'))
      .finally(() => setLoading(false));
  }, [lfmUsername, enabled, limit]);

  return { tracks, loading, error };
}
