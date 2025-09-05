import React, { useMemo } from 'react';
import { Artist } from '@/types';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export interface NeighborAnchor {
  id: string;
  name: string;
  // Screen-space coordinates relative to the graph container
  x: number;
  y: number;
}

interface ArtistNodeOverlayProps {
  show: boolean;
  selectedArtist?: Artist;
  // Screen-space position of the selected node
  nodeX?: number;
  nodeY?: number;
  neighbors?: NeighborAnchor[];
  onNeighborClick?: (neighborId: string) => void;
  onDismiss?: () => void;
  // Card helpers
  setArtistFromName: (name: string) => void;
  deselectArtist: () => void;
  similarFilter: (artists: string[]) => string[];
  // Report measured card bounds (relative to container) to parent
  onCardBounds?: (bounds: { left: number; top: number; width: number; height: number }) => void;
  // Container to compute relative offsets
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ArtistNodeOverlay: React.FC<ArtistNodeOverlayProps> = ({
  show,
  selectedArtist,
  nodeX,
  nodeY,
  neighbors = [],
  onNeighborClick,
  onDismiss,
  setArtistFromName,
  deselectArtist,
  similarFilter,
  onCardBounds,
  containerRef,
}) => {
  // Compute a smart offset for the card based on neighbor distribution
  const cardPosition = useMemo(() => {
    if (!show || typeof nodeX !== 'number' || typeof nodeY !== 'number') return null;
    if (!neighbors || neighbors.length === 0) {
      return { x: nodeX + 260, y: nodeY - 20 }; // default offset
    }
    // Compute centroid direction of neighbors relative to node
    let sx = 0, sy = 0;
    neighbors.forEach(n => { sx += (n.x - nodeX); sy += (n.y - nodeY); });
    const vx = sx / neighbors.length;
    const vy = sy / neighbors.length;
    // Place card opposite of neighbor centroid
    const norm = Math.hypot(vx, vy) || 1;
    const ox = -vx / norm;
    const oy = -vy / norm;
    const distance = 280; // px
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

  const cardRef = React.useRef<HTMLDivElement | null>(null);

  // Measure and report card bounds in container-relative screen coords
  const lastBoundsRef = React.useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!show || !cardRef.current || !onCardBounds) return;
    const report = () => {
      const cardRect = cardRef.current!.getBoundingClientRect();
      const containerRect = containerRef?.current?.getBoundingClientRect();
      if (!containerRect) return;
      const next = {
        left: cardRect.left - containerRect.left,
        top: cardRect.top - containerRect.top,
        width: cardRect.width,
        height: cardRect.height,
      };
      const last = lastBoundsRef.current;
      if (!last || last.left !== next.left || last.top !== next.top || last.width !== next.width || last.height !== next.height) {
        lastBoundsRef.current = next;
        onCardBounds(next);
      }
    };
    report();
    const ro = new ResizeObserver(() => report());
    ro.observe(cardRef.current!);
    window.addEventListener('resize', report);
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener('resize', report);
    };
  }, [show, onCardBounds, containerRef, cardPosition]);

  return (
    <>
      <div ref={cardRef} style={centerStyle}>
        <ArtistCard
          selectedArtist={selectedArtist}
          setArtistFromName={setArtistFromName}
          setSelectedArtist={() => { /* no-op in overlay */ }}
          artistLoading={false}
          artistError={false}
          show={!!show && !!selectedArtist}
          setShowArtistCard={() => { /* no-op in overlay */ }}
          deselectArtist={deselectArtist}
          similarFilter={similarFilter}
        />
      </div>

      {/* Neighbor traversal buttons placed on edges (midpoints) */}
      {show && typeof nodeX === 'number' && typeof nodeY === 'number' && neighbors?.map(n => {
        const dx = n.x - nodeX;
        const dy = n.y - nodeY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;
        // Place at 55% along the edge to minimize overlap with the node area
        const px = nodeX + dx * 0.55;
        const py = nodeY + dy * 0.55;
        return (
          <button
            key={n.id}
            title={`Go to ${n.name}`}
            onClick={() => onNeighborClick && onNeighborClick(n.id)}
            style={{
              position: 'absolute',
              left: px,
              top: py,
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

export default ArtistNodeOverlay;
