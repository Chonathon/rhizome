import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { History, Search, X, Ellipsis } from 'lucide-react'
import { BadgeIndicator } from '@/components/BadgeIndicator'
import { useRecentSelections, RecentSelectionItem, groupByTime } from '@/hooks/useRecentSelections'
import { useLastFmRecentTracks } from '@/hooks/useLastFmRecentTracks'
import { Artist } from '@/types'

interface RecentsPopoverProps {
  onItemSelect: (item: RecentSelectionItem) => void
  isCollapsed: boolean
  onSearchOpen?: () => void
  getArtistImageByName?: (name: string) => string | undefined
  getArtistByName?: (name: string) => Artist | undefined
  getArtistColor?: (artist: Artist) => string
  genreColorMap?: Map<string, string>
  lfmUsername?: string
}

export function RecentsPopover({
  onItemSelect,
  isCollapsed,
  onSearchOpen,
  getArtistImageByName,
  getArtistByName,
  getArtistColor,
  genreColorMap,
  lfmUsername,
}: RecentsPopoverProps) {
  const [open, setOpen] = useState(false)
  const { recentSelections, removeRecentSelection } = useRecentSelections()
  const { tracks: lfmTracks } = useLastFmRecentTracks(lfmUsername, !!lfmUsername)

  const hasRecents = recentSelections.length > 0
  const hasLfm = lfmTracks.length > 0

  const handleSelect = (item: RecentSelectionItem) => {
    onItemSelect(item)
    setOpen(false)
  }

  const resolveItemDisplay = (item: RecentSelectionItem) => {
    const isArtist = item.nodeType === 'artist'
    const artistObj = isArtist ? getArtistByName?.(item.name) : undefined
    const imageUrl = isArtist
      ? (item.image ?? (artistObj?.image && artistObj.image.trim().length > 0 ? artistObj.image : getArtistImageByName?.(item.name)))
      : undefined
    const color = isArtist
      ? (artistObj && getArtistColor ? getArtistColor(artistObj) : undefined)
      : genreColorMap?.get(item.id)
    return { isArtist, imageUrl, color }
  }

  const recentsList = !hasRecents && !hasLfm ? (
    <div className="flex flex-col items-center gap-2 py-10 px-4 overflow-y-auto">
      <Search className="h-5 w-5 text-muted-foreground/20" />
      <p className="text-xs text-muted-foreground/40 text-center">Nothing yet — start exploring</p>
    </div>
  ) : (
    <>
      {groupByTime(recentSelections.slice(0, 15)).map((group) => (
        <div key={group.label} className='overflow-hidden p-1'>
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            {group.label}
          </div>
          {group.items.map((item) => {
            const { isArtist, imageUrl, color } = resolveItemDisplay(item)
            return (
              <div
                key={item.id}
                className="group/item flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm font-semibold cursor-default select-none data-[selected=true]:bg-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSelect(item)}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`flex items-center ${!isArtist ? 'p-1.5' : ''}`}>
                    <BadgeIndicator
                      type={isArtist ? 'artist' : 'genre'}
                      name={item.name}
                      imageUrl={imageUrl}
                      color={color}
                      className={!isArtist ? 'size-2 flex-shrink-0' : 'flex-shrink-0'}
                    />
                  </div>
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); removeRecentSelection(item.id) }}
                    className="-m-2 hidden group-hover/item:flex"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      {hasLfm && (
        <div className='overflow-hidden p-1'>
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Last.fm
          </div>
          {lfmTracks.map((track) => (
            <div
              key={`lfm-${track.artist}-${track.timestamp}`}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold cursor-default select-none"
            >
              <div className="flex min-w-0 items-center gap-2 flex-1">
                {track.imageUrl
                  ? <img src={track.imageUrl} className="size-5 rounded-sm shrink-0 object-cover" />
                  : <div className="size-5 rounded-sm bg-muted shrink-0" />
                }
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{track.name}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{track.artist}</span>
                </div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0 leading-none">
                Last.fm
              </span>
            </div>
          ))}
        </div>
      )}
      {onSearchOpen && (
        <button
          className="flex items-center w-full gap-2 rounded-md px-2 py-2 text-sm font-medium cursor-default select-none hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
          onClick={onSearchOpen}
        >
          <Ellipsis className='size-5'/>
          View all
        </button>
      )}
    </>
  )

  // Expanded sidebar: render inline
  if (!isCollapsed) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="overflow-y-auto flex-1">
          {recentsList}
        </div>
      </div>
    )
  }

  // Collapsed sidebar: render as popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton tooltip="Recents" size="xl" isActive={open}>
          <History className="shrink-0" />
        </SidebarMenuButton>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 p-0 flex flex-col overflow-hidden"
      >
        <Command>
          <CommandInput placeholder="Filter recents..." />
          <CommandList className="max-h-[400px] overflow-y-auto">
            {!hasRecents && !hasLfm && <CommandEmpty>Nothing yet — start exploring</CommandEmpty>}
            {groupByTime(recentSelections).map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map((item) => {
                  const { isArtist, imageUrl, color } = resolveItemDisplay(item)
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => handleSelect(item)}
                      className="group/item flex items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className={`flex items-center ${!isArtist ? 'p-1.5' : ''}`}>
                          <BadgeIndicator
                            type={isArtist ? 'artist' : 'genre'}
                            name={item.name}
                            imageUrl={imageUrl}
                            color={color}
                            className={!isArtist ? 'size-2 flex-shrink-0' : 'flex-shrink-0'}
                          />
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); removeRecentSelection(item.id) }}
                          className="-m-2 hidden group-hover/item:flex"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X />
                        </Button>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
            {hasLfm && (
              <CommandGroup heading="Last.fm">
                {lfmTracks.map((track) => (
                  <CommandItem
                    key={`lfm-${track.artist}-${track.timestamp}`}
                    value={`${track.name} ${track.artist}`}
                    className="flex items-center gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2 flex-1">
                      {track.imageUrl
                        ? <img src={track.imageUrl} className="size-5 rounded-sm shrink-0 object-cover" />
                        : <div className="size-5 rounded-sm bg-muted shrink-0" />
                      }
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{track.name}</span>
                        <span className="truncate text-xs font-normal text-muted-foreground">{track.artist}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0 leading-none">
                      Last.fm
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
