import React, { useMemo } from 'react';
import { Artist, BasicNode, Genre } from '@/types';
import { GraphCard } from '@/components/GraphCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import useGenreArtists from '@/hooks/useGenreArtists';

export interface NeighborAnchor {
  id: string;
  name: string;
  x: number; // screen-space position
  y: number;
}

interface GenreNodeOverlayProps {
  show: boolean;
  selectedGenre?: Genre;
  // Screen-space position of the selected node
  nodeX?: number;
  nodeY?: number;
  neighbors?: NeighborAnchor[];
  onNeighborClick?: (neighborId: string) => void;
  onDismiss?: () => void;
  onLinkedGenreClick?: (genreID: string) => void;
  onTopArtistClick?: (artist: Artist) => void;
  allArtists?: (genre: Genre) => void;
}

export const GenreNodeOverlay: React.FC<GenreNodeOverlayProps> = ({
  show,
  selectedGenre,
  nodeX,
  nodeY,
  neighbors = [],
  onNeighborClick,
  onDismiss,
  onLinkedGenreClick,
  onTopArtistClick,
  allArtists,
}) => {
  // Compute a smart offset for card placement based on neighbor distribution
  const cardPosition = useMemo(() => {
    if (!show || typeof nodeX !== 'number' || typeof nodeY !== 'number') return null;
    if (!neighbors || neighbors.length === 0) {
      return { x: nodeX + 260, y: nodeY - 20 };
    }
    let sx = 0, sy = 0;
    neighbors.forEach(n => { sx += (n.x - nodeX); sy += (n.y - nodeY); });
    const vx = sx / neighbors.length;
    const vy = sy / neighbors.length;
    const norm = Math.hypot(vx, vy) || 1;
    const ox = -vx / norm;
    const oy = -vy / norm;
    const distance = 300;
    const x = nodeX + ox * distance;
    const y = nodeY + oy * (distance * 0.6);
    return { x, y };
  }, [show, nodeX, nodeY, neighbors]);

  const centerStyle = useMemo(() => {
    if (!cardPosition) return { display: 'none' } as React.CSSProperties;
    return {
      position: 'absolute' as const,
      left: cardPosition.x,
      top: cardPosition.y,
      transform: 'translate(-50%, -50%)',
      zIndex: 30,
      pointerEvents: 'auto',
    } as React.CSSProperties;
  }, [cardPosition]);

  const { artists: genreArtists } = useGenreArtists(selectedGenre?.id);
  const topArtists = useMemo(() => {
    return (genreArtists ?? [])
      .slice()
      .sort((a, b) => (b.listeners ?? 0) - (a.listeners ?? 0))
      .slice(0, 8);
  }, [genreArtists]);

  const relatedLine = (label: string, nodes?: BasicNode[]) => {
    if (!nodes || nodes.length === 0) return null;
    const items = nodes.slice(0, 5);
    return (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <div className='flex items-center gap-1.5 flex-wrap'>
          {items.map((node, i) => (
            <>
              {onLinkedGenreClick ? (
                <Button variant="link" size="sm" key={node.id} onClick={() => onLinkedGenreClick(node.id)}>{node.name}</Button>
              ) : (
                <span key={node.id}>{node.name}</span>
              )}
              {i < items.length - 1 ? ' · ' : ''}
            </>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={centerStyle}>
        <GraphCard
          show={!!show && !!selectedGenre}
          loading={false}
          dismissible
          onDismiss={onDismiss}
          contentKey={selectedGenre?.id}
          title={<h2 className="w-full text-md font-semibold">{selectedGenre?.name}</h2>}
          meta={
            <div className="flex flex-col gap-1">
              {typeof selectedGenre?.artistCount === 'number' && (
                <h3>
                  <span className="text-sm text-muted-foreground">Artists:</span> {formatNumber(selectedGenre.artistCount)}
                </h3>
              )}
              {typeof selectedGenre?.totalListeners === 'number' && (
                <h3>
                  <span className="text-sm text-muted-foreground">Listeners:</span> {formatNumber(selectedGenre.totalListeners)}
                </h3>
              )}
              {typeof selectedGenre?.totalPlays === 'number' && (
                <h3>
                  <span className="text-sm text-muted-foreground">Plays:</span> {formatNumber(selectedGenre.totalPlays)}
                </h3>
              )}
            </div>
          }
          description={
            <div className="flex flex-col gap-2">
              {/* Image strip from top artists */}
              {topArtists.length > 0 && (
                <div className="flex -space-x-2">
                  {topArtists.slice(0, 5).map(artist => (
                    artist.image ? (
                      <img key={artist.id} src={artist.image as string} alt={artist.name} className="w-8 h-8 rounded-full border border-border object-cover" loading="lazy" />
                    ) : (
                      <div key={artist.id} className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center text-[10px]">
                        {artist.name[0]}
                      </div>
                    )
                  ))}
                </div>
              )}
              <p className="text-muted-foreground line-clamp-4 break-words">{selectedGenre?.description || 'No description'}</p>
              {topArtists.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Top Artists</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {topArtists.map(artist => (
                      <Badge asChild key={artist.id} variant="outline" title={`${artist.listeners?.toLocaleString() ?? 0} listeners`}>
                        <Button variant="ghost" size="sm" onClick={() => onTopArtistClick?.(artist)} className="cursor-pointer">
                          {artist.name}
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Related</span>
                {relatedLine('Subgenre of', selectedGenre?.subgenre_of)}
                {relatedLine('Subgenres', selectedGenre?.subgenres)}
                {relatedLine('Influenced by', selectedGenre?.influenced_by)}
                {relatedLine('Influences', selectedGenre?.influenced_genres)}
                {relatedLine('Fusion of', selectedGenre?.fusion_of)}
              </div>
              {allArtists && selectedGenre && (
                <Button size="sm" variant="secondary" onClick={() => allArtists(selectedGenre)} className="mt-1 self-start">
                  See All Artists
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Neighbor traversal buttons placed on edges (midpoints) */}
      {show && typeof nodeX === 'number' && typeof nodeY === 'number' && neighbors?.map(n => {
        const dx = n.x - nodeX;
        const dy = n.y - nodeY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;
        return (
          <button
            key={n.id}
            title={`Go to ${n.name}`}
            onClick={() => onNeighborClick && onNeighborClick(n.id)}
            style={{
              position: 'absolute',
              left: nodeX + dx * 0.55,
              top: nodeY + dy * 0.55,
              transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              zIndex: 31,
            }}
            className="rounded-full bg-background/80 border border-border shadow-sm hover:bg-background text-foreground w-7 h-7 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        );
      })}
    </>
  );
};

export default GenreNodeOverlay;
