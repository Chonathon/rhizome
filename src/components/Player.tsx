import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipBack, SkipForward, ExternalLink, Minimize2, Maximize2, X } from "lucide-react";
import { appendYoutubeWatchURL } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Anchor = "bottom-left" | "bottom-right" | "top-left" | "top-right";

type PlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoIds: string[];
  title?: string;
  autoplay?: boolean;
  anchor?: Anchor;
};

// Load the YouTube IFrame API once
let ytApiPromise: Promise<any> | null = null;
function loadYTApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('No window');
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev && prev();
      resolve(window.YT);
    };
  });
  return ytApiPromise;
}

const anchorClass = (anchor: Anchor) => {
  switch (anchor) {
    case 'bottom-left': return 'left-4 bottom-4';
    case 'bottom-right': return 'right-4 bottom-4';
    case 'top-left': return 'left-4 top-4';
    case 'top-right': return 'right-4 top-4';
    default: return 'left-4 bottom-4';
  }
}

export default function Player({ open, onOpenChange, videoIds, title, autoplay = true, anchor = 'bottom-left' }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const hasPlaylist = videoIds && videoIds.length > 1;
  const currentVideoId = videoIds?.[currentIndex] || videoIds?.[0];

  const mountPlayer = useCallback(async () => {
    if (!containerRef.current || !open) return;
    const YT = await loadYTApi();
    // Clean existing
    if (playerRef.current && playerRef.current.destroy) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    const elementId = `yt-frame-${Math.random().toString(36).slice(2)}`;
    const frame = document.createElement('div');
    frame.id = elementId;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(frame);
    playerRef.current = new YT.Player(elementId, {
      height: '100%',
      width: '100%',
      videoId: videoIds?.[0],
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          setReady(true);
          setDuration(playerRef.current?.getDuration?.() || 0);
          setCurrentIndex(0);
          if (hasPlaylist) {
            // Cue/load playlist based on autoplay
            const fn = autoplay ? 'loadPlaylist' : 'cuePlaylist';
            playerRef.current?.[fn]?.(videoIds);
          }
        },
        onStateChange: (e: any) => {
          // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
          const state = e?.data;
          if (state === 1) setIsPlaying(true);
          if (state === 2 || state === 0) setIsPlaying(false);
          if (state === 0 && hasPlaylist) {
            // ended: update index from API if available
            const idx = playerRef.current?.getPlaylistIndex?.();
            if (typeof idx === 'number') setCurrentIndex(idx);
          }
          // Refresh duration when ready/playing
          if (state === 1 || state === 5) {
            setDuration(playerRef.current?.getDuration?.() || 0);
          }
        }
      }
    });
  }, [open, videoIds, autoplay, hasPlaylist]);

  // Mount player when opened or video list changes
  useEffect(() => {
    if (!open || !videoIds || videoIds.length === 0) return;
    setReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    mountPlayer();
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [open, videoIds, mountPlayer]);

  // Progress polling
  useEffect(() => {
    if (!open) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (!playerRef.current) return;
      const t = playerRef.current.getCurrentTime?.();
      const d = playerRef.current.getDuration?.();
      if (typeof t === 'number') setCurrentTime(t);
      if (typeof d === 'number') setDuration(d);
      const idx = playerRef.current?.getPlaylistIndex?.();
      if (typeof idx === 'number') setCurrentIndex(idx);
    }, 500);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [open]);

  const percent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo?.();
    else playerRef.current.playVideo?.();
  };

  const next = () => {
    if (!playerRef.current) return;
    if (hasPlaylist) playerRef.current.nextVideo?.();
  };

  const prev = () => {
    if (!playerRef.current) return;
    if (hasPlaylist) playerRef.current.previousVideo?.();
  };

  const seekTo = (clientX: number, element: HTMLElement | null) => {
    if (!element || !playerRef.current || !duration) return;
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    playerRef.current.seekTo?.(ratio * duration, true);
  };

  const onOpenInYouTube = () => {
    const id = playerRef.current?.getVideoData?.()?.video_id || currentVideoId;
    if (!id) return;
    window.open(appendYoutubeWatchURL(id), '_blank');
  };

  const onClose = () => {
    try { playerRef.current?.stopVideo?.(); } catch {}
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className={`fixed z-50 ${anchorClass(anchor)} w-[240px]`}>
      <div className="group rounded-xl border border-sidebar-border bg-popover shadow-xl overflow-hidden">
        {/* Header */}
        <div className="hidden group-hover:flex items-center justify-between gap-2 p-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{title || 'Player'}</div>
            {hasPlaylist && (
              <div className="text-xs text-muted-foreground">{currentIndex + 1} / {videoIds.length}</div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed((v) => !v)} title={collapsed ? 'Expand' : 'Minimize'}>
              {collapsed ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}          
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X size={18}/>
            </Button>
          </div>
        </div>
        {/* Video */}
        {!collapsed && (
          <div className="w-full aspect-video bg-black">
            <div ref={containerRef} className="w-full h-full" />
          </div>
        )}
        {/* Controls */}
        <div className="p-2 flex items-center gap-2">
          {/* Progress */}
          <div className="w-full">
            <span className="text-sm font-medium text-foreground">{title || 'Player'}</span>
            <Progress
              value={percent}
              onMouseDown={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
              onClick={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
            />
            {/* <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div> */}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-[1px]">
              {/* <Button variant="ghost" size="icon" onClick={prev} disabled={!hasPlaylist} title="Previous">
                <SkipBack size={18}/>
              </Button> */}
              <Button variant="ghost" size="icon" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={18}/> : <Play size={18}/>} 
              </Button>
              <Button variant="ghost" size="icon" onClick={next} disabled={!hasPlaylist} title="Next">
                <SkipForward size={18}/>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  if (!sec || sec < 0 || !isFinite(sec)) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
