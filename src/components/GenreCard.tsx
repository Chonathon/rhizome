import { BasicNode, Genre } from '@/types'
import { formatNumber } from '@/lib/utils'
import { useEffect, useState } from "react"
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from './ui/button';
import { SquareArrowUp, X } from 'lucide-react';
import { useMediaQuery } from "@/hooks/use-media-query"


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
  const [isExpanded, setIsExpanded] = useState(true)
  const [open, setOpen] = useState(false)

  const onDismiss = () => {
    setIsExpanded(false)
    setOpen(false)
    deselectGenre()
  }

  const relatedLine = (label: string, nodes?: BasicNode[]) => {
    if (!nodes || nodes.length === 0) return null
    const items = nodes.slice(0, limitRelated)
    return (
      <h3 className="flex flex-col items-start gap-1 mb-3">
        <span className="text-sm text-muted-foreground">{label}:</span>{' '}
        <div className='flex items-center gap-1 flex-wrap'>
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
      </h3>
    )
  }

  const isDesktop = useMediaQuery("(min-width: 640px)")

  const initial = selectedGenre?.name?.[0]?.toUpperCase() ?? '?'

  // Auto-open the sheet when a genre is selected and show is true
  useEffect(() => {
    if (show && selectedGenre) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [show, selectedGenre])

  if (!show) return null

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onDismiss()
      }}
      direction={isDesktop ? "right" : "bottom"}
      dismissible={false}
      modal={false}
    >
      <DrawerContent
        className="p-2 sm:p-2 rounded-l-3xl bg-transparent border-transparent w-[320px]"
      >
        {/* Sidebar-styled container */}
        <div className="relative px-3 space-y-3 bg-sidebar backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm flex h-full w-full flex-col overflow-hidden">
          {/* Close button */}
          <div className="flex justify-end -mb-1">
            <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Close genre">
              <X className="size-4" />
            </Button>
          </div>
          {/* Thumbnail full-width when expanded */}
          <div className={`w-full overflow-hidden border-b border-sidebar-border rounded-lg h-[200px]`}>
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
              <span className="text-4xl font-semibold">{initial}</span>
            </div>
          </div>

          {/* Content */}
          <div className="w-full flex flex-col">
            <h2 className="text-lg font-semibold">{selectedGenre?.name}</h2>
              <div className="text-sm">
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
              </div>
            <div className="mt-3">
              <Button
                disabled={genreLoading}
                variant="secondary"
                size="lg"
                onClick={() => selectedGenre && allArtists(selectedGenre)}
              >
                <SquareArrowUp />All Artists
              </Button>
            </div>

            <div className="text-sm space-y-1 mt-3">
            {genreError && <p>Can’t find {selectedGenre?.name} 🤔</p>}
            {!genreError && (
              <>
                {relatedLine('Subgenre of', selectedGenre?.subgenre_of)}
                {relatedLine('Subgenres', selectedGenre?.subgenres)}
                {relatedLine('Influenced by', selectedGenre?.influenced_by)}
                {relatedLine('Influences', selectedGenre?.influenced_genres)}
                {relatedLine('Fusion of', selectedGenre?.fusion_of)}
              </>
            )}
            </div>
            
            
            <p
              onClick={() => setIsExpanded(prev => !prev)}
              className={` mt-3 break-words text-muted-foreground cursor-pointer hover:text-gray-400 ${isExpanded ? 'text-muted-foreground' : 'line-clamp-3 overflow-hidden'}`}
            >
              {selectedGenre?.description || 'No description'}
            </p>

          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default GenreCard;
