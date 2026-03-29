import { useEffect, useState } from 'react';
import { lastFMRecentTracks } from '@/apis/usersApi';

export interface LastFmTrack {
  name: string;
  artist: string;
  album: string;
  timestamp: number;
  nowPlaying?: boolean;
  imageUrl?: string;
}

export function useLastFmRecentTracks(lfmUsername?: string, enabled = true, limit = 20) {
  const [tracks, setTracks] = useState<LastFmTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lfmUsername || !enabled) {
      setTracks([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    lastFMRecentTracks(lfmUsername, limit)
      .then((data) => { if (mounted) setTracks(data.map((t) => ({ ...t, imageUrl: t.imageUrl ?? undefined }))); })
      .catch(() => { if (mounted) setError('Failed to load Last.fm data'); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [lfmUsername, enabled, limit]);

  return { tracks, loading, error };
}
