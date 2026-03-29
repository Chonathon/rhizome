import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { History, Clock, Search, X } from 'lucide-react'
import { BadgeIndicator } from '@/components/BadgeIndicator'
import { useRecentSelections, RecentSelectionItem, MAX_RECENT_SELECTIONS } from '@/hooks/useRecentSelections'
import { useLastFmRecentTracks } from '@/hooks/useLastFmRecentTracks'
import useAuth from '@/hooks/useAuth'
import { Artist } from '@/types'


function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  const hr = Math.floor(diff / 3_600_000)
  const day = Math.floor(diff / 86_400_000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  if (hr < 24) return `${hr}h`
  if (day === 1) return 'Yesterday'
  if (day < 7) return new Date(ts).toLocaleDateString('en', { weekday: 'short' })
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

type TimeGroup = { label: string; items: RecentSelectionItem[] }

function groupByTime(items: RecentSelectionItem[]): TimeGroup[] {
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const yesterdayStart = todayStart - 86_400_000
  const weekStart = todayStart - 6 * 86_400_000

  const groups: TimeGroup[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Older', items: [] },
  ]

  for (const item of items) {
    if (item.timestamp >= todayStart) groups[0].items.push(item)
    else if (item.timestamp >= yesterdayStart) groups[1].items.push(item)
    else if (item.timestamp >= weekStart) groups[2].items.push(item)
    else groups[3].items.push(item)
  }

  return groups.filter(g => g.items.length > 0)
}

interface RecentsPopoverProps {
  onItemSelect: (item: RecentSelectionItem) => void
  isCollapsed: boolean
  onSearchOpen?: () => void
  getArtistImageByName?: (name: string) => string | undefined
  getArtistByName?: (name: string) => Artist | undefined
  getArtistColor?: (artist: Artist) => string
  genreColorMap?: Map<string, string>
}

export function RecentsPopover({
  onItemSelect,
  isCollapsed,
  onSearchOpen,
  getArtistImageByName,
  getArtistByName,
  getArtistColor,
  genreColorMap,
}: RecentsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [showLfm, setShowLfm] = useState(false)
  const { recentSelections, removeRecentSelection } = useRecentSelections()
  const { lfmUsername } = useAuth()

  const { tracks, loading: lfmLoading } = useLastFmRecentTracks(
    lfmUsername,
    showLfm,
    20
  )

  const displayedRecents = recentSelections.slice(0, 15)
  const hasRecents = recentSelections.length > 0
  const groups = groupByTime(displayedRecents)
  const popoverGroups = groupByTime(recentSelections)

  const handleSelect = (item: RecentSelectionItem) => {
    onItemSelect(item)
    setOpen(false)
  }

  const lfmToggle = lfmUsername ? (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Last.fm</span>
      <Switch checked={showLfm} onCheckedChange={setShowLfm} className="scale-75" />
    </div>
  ) : null

  const clearButton = !showLfm && hasRecents ? (
    <button
      className="text-[9px] uppercase tracking-wider text-muted-foreground/40 hover:text-foreground transition-colors"
      onClick={() => displayedRecents.forEach((item) => removeRecentSelection(item.id))}
    >
      Clear all
    </button>
  ) : null

  const lfmList = lfmLoading ? (
    <div className="px-3 py-2 space-y-1.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  ) : tracks.length === 0 ? (
    <div className="flex flex-col items-center gap-2 py-10 px-4">
      <Clock className="h-5 w-5 text-muted-foreground/20" />
      <p className="text-xs text-muted-foreground/40 text-center">No scrobbles found</p>
    </div>
  ) : (
    <>
      {tracks.map((track, i) => (
        <div key={i} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors">
          <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20">
            <Clock className="h-3 w-3 text-red-400/70" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
            <p className="text-sm font-medium leading-tight truncate w-full">{track.name}</p>
            <p className="text-xs text-muted-foreground leading-tight truncate w-full">{track.artist}</p>
          </div>
          {track.nowPlaying ? (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
              {formatTime(track.timestamp)}
            </span>
          )}
        </div>
      ))}
    </>
  )

  const recentsList = !hasRecents ? (
    <div className="flex flex-col items-center gap-2 py-10 px-4">
      <Search className="h-5 w-5 text-muted-foreground/20" />
      <p className="text-xs text-muted-foreground/40 text-center">Nothing yet — start exploring</p>
    </div>
  ) : (
    <>
      {groups.map((group) => (
        <div key={group.label} className='pb-3'>
          <div className="flex items-center gap-2 px-2 pb-0.5">
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {group.label}
            </span>
          </div>
          {group.items.map((item) => {
            const isArtist = item.nodeType === 'artist'
            const artistObj = isArtist ? getArtistByName?.(item.name) : undefined
            const imageUrl = isArtist
              ? (item.image ?? (artistObj?.image && artistObj.image.trim().length > 0 ? artistObj.image : getArtistImageByName?.(item.name)))
              : undefined
            const color = isArtist
              ? (artistObj && getArtistColor ? getArtistColor(artistObj) : undefined)
              : genreColorMap?.get(item.id)
            return (
              <div
                key={item.id}
                className="group/item flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
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
                  {/* <span className="text-[10px] text-muted-foreground tabular-nums group-hover/item:hidden">
                    {formatTime(item.timestamp)}
                  </span> */}
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
      {onSearchOpen && (
        <Button
          variant="link" 
          size="sm"
          className="px-6"
          onClick={onSearchOpen}
        >
          More...
        </Button>
      )}
    </>
  )

  // Expanded sidebar: render inline
  if (!isCollapsed) {
    return (
      <div className="flex flex-col w-full">
        <div className="h-full">
          {showLfm ? lfmList : recentsList}
        </div>
      </div>
    )
  }

  // Collapsed sidebar: render as popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton tooltip="Recent Activity" size="xl" isActive={open}>
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
          <CommandList className="max-h-320 overflow-y-auto">
            {!hasRecents && <CommandEmpty>Nothing yet — start exploring</CommandEmpty>}
            {popoverGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map((item) => {
                  const isArtist = item.nodeType === 'artist'
                  const artistObj = isArtist ? getArtistByName?.(item.name) : undefined
                  const imageUrl = isArtist
              ? (item.image ?? (artistObj?.image && artistObj.image.trim().length > 0 ? artistObj.image : getArtistImageByName?.(item.name)))
              : undefined
                  const color = isArtist
                    ? (artistObj && getArtistColor ? getArtistColor(artistObj) : undefined)
                    : genreColorMap?.get(item.id)
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
