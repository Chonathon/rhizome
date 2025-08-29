import { BasicNode, Genre } from '@/types'
import { formatNumber } from '@/lib/utils'
import { useEffect, useState } from "react"
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from './ui/button';
import useGenreArtists from "@/hooks/useGenreArtists";
import { SquareArrowUp, X } from 'lucide-react';
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from './ui/badge';


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
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="text-md text-muted-foreground">{label}:</span>
        <div className='flex items-center gap-1.5 flex-wrap'>
          {items.map((node, i) => (
            <>
              {onLinkedGenreClick ? (
                <Button variant="link" size="lg" key={node.id} onClick={() => onLinkedGenreClick(node.id)}>{node.name}</Button>
              ) : (
                <span key={node.id}>{node.name}</span>
              )}
              {i < items.length - 1 ? ' · ' : ''}
            </>
          ))}
        </div>
      </div>
    )
  }

  const isDesktop = useMediaQuery("(min-width: 640px)")

  const initial = selectedGenre?.name?.[0]?.toUpperCase() ?? '?'

  // Top artists for this genre (by listeners)
  const { artists: genreArtists } = useGenreArtists(selectedGenre?.id)
  const topArtists = (genreArtists ?? [])
    .slice()
    .sort((a, b) => (b.listeners ?? 0) - (a.listeners ?? 0))
    .slice(0, 8)

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
        className="sm:p-2 sm-h-full rounded-l-3xl bg-transparent border-transparent sm:w-[320px]"
      >
        {/* Sidebar-styled container */}
        <div className="relative px-3 space-y-3 bg-sidebar backdrop-blur-sm border border-sidebar-border rounded-3xl shadow-sm flex h-full w-full flex-col overflow-y-auto">
          {/* Close button */}
          <div className="flex justify-end -mb-1">
            <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Close genre">
              <X />
            </Button>
          </div>
          {/* Thumbnail full-width when expanded */}
          <div className={`w-full overflow-hidden border-b border-sidebar-border rounded-lg h-[200px]`}>
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300/30 to-gray-300/30 dark:from-gray-400/20 dark:to-gray-400/20">
              <span className="text-4xl font-semibold">{initial}</span>
            </div>
          </div>

          {/* Content */}
          <div className="w-full flex flex-col gap-2">
            <div>
              <h2 className="text-xl font-semibold">{selectedGenre?.name}</h2>
                
            </div>
              {/* Top Artists */}
              {topArtists.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-md font-semibold">Top Artists:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {topArtists.map((artist) => (
                      <Badge
                        key={artist.id}
                        variant="outline"
                        className=""
                        title={`${artist.listeners?.toLocaleString() ?? 0} listeners`}
                      >
                        {artist.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button
                disabled={genreLoading}
                size="lg"
                variant="secondary"
                onClick={() => selectedGenre && allArtists(selectedGenre)}
              >
                <SquareArrowUp />All Artists
              </Button>

            <div>
            {genreError && <p>Can’t find {selectedGenre?.name} 🤔</p>}
            {!genreError && (
              <div className='flex flex-col gap-2'>
                <text className='text-md font-semibold'>Related</text>
                <>
                  {relatedLine('Subgenre of', selectedGenre?.subgenre_of)}
                  {relatedLine('Subgenres', selectedGenre?.subgenres)}
                  {relatedLine('Influenced by', selectedGenre?.influenced_by)}
                  {relatedLine('Influences', selectedGenre?.influenced_genres)}
                  {relatedLine('Fusion of', selectedGenre?.fusion_of)}
                </>
              </div>
            )}
            <div className="flex flex-col gap-2">
                  {/* {typeof selectedGenre?.artistCount === 'number' && (
                    <h3>
                      <span className="font-medium">Artists:</span>{' '}
                      {formatNumber(selectedGenre.artistCount)}
                    </h3>
                  )} */}
                  <text className='text-md font-semibold'>Stats</text>
                  {typeof selectedGenre?.totalListeners === 'number' && (
                    <h3>
                      <span className="">Listeners:</span>{' '}
                      {formatNumber(selectedGenre.totalListeners)}
                    </h3>
                  )}
                  {/* {typeof selectedGenre?.totalPlays === 'number' && (
                    <h3>
                      <span className="font-medium">Plays:</span>{' '}
                      {formatNumber(selectedGenre.totalPlays)}
                    </h3>
                  )} */}
                </div>
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
