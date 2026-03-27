import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { History, Music2, Tag, Clock, Search } from 'lucide-react'
import { useRecentSelections, RecentSelectionItem } from '@/hooks/useRecentSelections'
import { useLastFmRecentTracks } from '@/hooks/useLastFmRecentTracks'
import useAuth from '@/hooks/useAuth'

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

interface RecentsPopoverProps {
  onItemSelect: (item: RecentSelectionItem) => void
  isCollapsed: boolean
}

export function RecentsPopover({ onItemSelect, isCollapsed }: RecentsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [showLfm, setShowLfm] = useState(false)
  const { recentSelections, removeRecentSelection } = useRecentSelections()
  const { lfmUsername } = useAuth()

  const { tracks, loading: lfmLoading } = useLastFmRecentTracks(
    lfmUsername,
    showLfm,
    20
  )

  const displayedRecents = recentSelections.slice(0, 20)
  const hasRecents = displayedRecents.length > 0

  const handleSelect = (item: RecentSelectionItem) => {
    onItemSelect(item)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton tooltip="Recent Activity" size="xl" isActive={open}>
          <History className="shrink-0" />
          {!isCollapsed && <span className="truncate">Recents</span>}
        </SidebarMenuButton>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 p-0 flex flex-col max-h-[480px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
          <span className="text-sm font-semibold">
            {showLfm ? 'Last.fm Scrobbles' : 'Recent Activity'}
          </span>
          <div className="flex items-center gap-2">
            {!showLfm && hasRecents && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  displayedRecents.forEach((item) => removeRecentSelection(item.id))
                }}
              >
                Clear all
              </button>
            )}
            {lfmUsername && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Last.fm</span>
                <Switch
                  checked={showLfm}
                  onCheckedChange={setShowLfm}
                  className="scale-75"
                />
              </div>
            )}
          </div>
        </div>

        <Separator className="shrink-0" />

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-1">
          {showLfm ? (
            lfmLoading ? (
              <div className="px-3 py-2 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : tracks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Clock className="h-6 w-6 opacity-30" />
                <p className="text-xs">No scrobbles found</p>
              </div>
            ) : (
              tracks.map((track, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent/50 transition-colors">
                  <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-400">
                    <Clock className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  {track.nowPlaying ? (
                    <span className="text-[10px] text-green-500 shrink-0">▶</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 shrink-0">{formatTime(track.timestamp)}</span>
                  )}
                </div>
              ))
            )
          ) : !hasRecents ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Search className="h-6 w-6 opacity-30" />
              <p className="text-xs">No recent activity</p>
            </div>
          ) : (
            displayedRecents.map((item) => {
              const isArtist = item.nodeType === 'artist'
              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-2.5 px-3 py-2 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${isArtist ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                    {isArtist ? <Music2 className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                  </div>
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground/60">{formatTime(item.timestamp)}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground text-sm leading-none"
                      onClick={(e) => { e.stopPropagation(); removeRecentSelection(item.id) }}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
