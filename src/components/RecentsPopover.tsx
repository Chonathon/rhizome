import { useState, useRef, useEffect } from 'react'
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
  const hasApiKey = !!import.meta.env.VITE_LASTFM_API_KEY

  const { tracks, loading: lfmLoading } = useLastFmRecentTracks(
    lfmUsername,
    showLfm && hasApiKey,
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
          <span className="text-sm font-semibold">Recent Activity</span>
          {hasRecents && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                displayedRecents.forEach((item) => removeRecentSelection(item.id))
              }}
            >
              Clear all
            </button>
          )}
        </div>

        <Separator className="shrink-0" />

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-1">
          {!hasRecents ? (
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

        {/* Last.fm section */}
        {lfmUsername && (
          <>
            <Separator className="shrink-0" />
            <div className="shrink-0 px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last.fm</span>
              <Switch
                checked={showLfm}
                onCheckedChange={setShowLfm}
                className="scale-75"
              />
            </div>

            {showLfm && (
              <div className="border-t border-border overflow-y-auto max-h-36">
                {!hasApiKey ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Set <code className="font-mono text-[10px] bg-muted px-1 rounded">VITE_LASTFM_API_KEY</code> to sync scrobbles.
                  </p>
                ) : lfmLoading ? (
                  <div className="px-3 py-2 space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
                  </div>
                ) : tracks.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No scrobbles found.</p>
                ) : (
                  tracks.map((track, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                      <Clock className="h-3 w-3 text-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{track.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      {track.nowPlaying && (
                        <span className="text-[10px] text-green-500 shrink-0">▶</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
