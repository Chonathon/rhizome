import { BasicNode, Genre } from '@/types'
import { formatNumber } from '@/lib/utils'
import { useState } from "react"
import GraphCard from "./GraphCard";
import { Button } from './ui/button';
import { SquareArrowUp } from 'lucide-react';

interface GenreCardProps {
  selectedGenre?: Genre;
  allArtists: (genre: Genre) => void
  show: boolean;
  genreLoading: boolean;
  genreError?: boolean;
  deselectGenre: () => void;
  onSelectGenre?: (name: string) => void;
  onLinkedGenreClick: (genreID: string) => void;
  limitRelated?: number;
}

export function GenreCard({
  selectedGenre,
  show,
  genreLoading,
  genreError,
  allArtists,
  deselectGenre,
  onSelectGenre,
  onLinkedGenreClick,
  limitRelated = 5,
}: GenreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const onDismiss = () => {
    setIsExpanded(false)
    deselectGenre()
  }

  const relatedLine = (label: string, nodes?: BasicNode[]) => {
    if (!nodes || nodes.length === 0) return null
    const items = nodes.slice(0, limitRelated)
    return (
      <h3>
        <span className="font-medium">{label}:</span>{' '}
        {items.map((node, i) => (
          <>
            {onLinkedGenreClick ? (
              <Button variant="link" size="sm" key={node.id} onClick={() => onLinkedGenreClick(node.id)}>{node.name}</Button>
            ) : (
              <span key={node.id}>{node.name}</span>
            )}
            {i < items.length - 1 ? ', ' : ''}
          </>
        ))}
      </h3>
    )
  }

  const initial = selectedGenre?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <GraphCard
      show={!!show}
      loading={genreLoading}
      error={genreError && <p>Can’t find {selectedGenre?.name} 🤔</p>}
      dismissible
      onDismiss={onDismiss}
      contentKey={selectedGenre?.name}
      stacked={isExpanded}

      thumbnail={
        <div className={`w-24 h-24 shrink-0 overflow-hidden rounded-xl border border-border ${isExpanded ? 'w-full h-[200px]' : ''}`}>
          {/* replace with color of node */}
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-purple-400/20 dark:to-indigo-400/20`}> 
            <span className="text-3xl font-semibold">{initial}</span>
          </div>
        </div>
      }
      title={<h2 className="w-full text-md font-semibold">{selectedGenre?.name}</h2>}
      meta={
        <>
          {typeof selectedGenre?.artistCount === 'number' && (
            <h3>
              <span className="font-medium">Artists:</span>{' '}
              {formatNumber(selectedGenre.artistCount)}
            </h3>
          )}
          {typeof selectedGenre?.totalListeners === 'number' && (
            <h3>
              <span className="font-medium">Listeners:</span>{' '}
              {formatNumber(selectedGenre.totalListeners)}
            </h3>
          )}
          {typeof selectedGenre?.totalPlays === 'number' && (
            <h3>
              <span className="font-medium">Plays:</span>{' '}
              {formatNumber(selectedGenre.totalPlays)}
            </h3>
          )}
          {relatedLine('Subgenre of', selectedGenre?.subgenre_of)}
          {relatedLine('Subgenres', selectedGenre?.subgenres)}
          {relatedLine('Influenced by', selectedGenre?.influenced_by)}
          {relatedLine('Influences', selectedGenre?.influenced_genres)}
          {relatedLine('Fusion of', selectedGenre?.fusion_of)}
        </>
      }
      description={
        <p
          onClick={() => setIsExpanded(prev => !prev)}
          className={`break-words text-muted-foreground cursor-pointer hover:text-gray-400 ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
        >
          {selectedGenre?.description || 'No description'}
        </p>
      }
      actions={
        <Button 
          variant="ghost" className="-mx-2.5" size="sm" 
          onClick={() => selectedGenre && allArtists(selectedGenre)} >
          <SquareArrowUp />All Artists</Button>
      }
    />
  )
}

export default GenreCard;
