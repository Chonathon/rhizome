import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, ChevronsDown, ChevronsUp, X, SkipForward } from "lucide-react";
import { appendYoutubeWatchURL } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import RhizomeLogo from "@/components/RhizomeLogo";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Anchor = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right";

type PlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoIds: string[];
  title?: string;
  autoplay?: boolean;
  anchor?: Anchor;
  artworkUrl?: string;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  headerPreferProvidedTitle?: boolean;
  onTitleClick?: () => void;
  // Pixels between the sidebar edge and the player when no drawer is open
  sidebarGapPx?: number;
  // Pixels between the drawer edge and the player when a left drawer is open
  drawerGapPx?: number;
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
    case 'bottom-center': return 'left-1/2 right-1/2 bottom-4';
    case 'bottom-right': return 'right-4 bottom-4';
    case 'top-left': return 'left-4 top-4';
    case 'top-right': return 'right-4 top-4';
    default: return 'left-4 bottom-4';
  }
}

export default function Player({ open, onOpenChange, videoIds, title, autoplay = true, anchor = 'bottom-left', artworkUrl, loading, onLoadingChange, headerPreferProvidedTitle, onTitleClick, sidebarGapPx = 12, drawerGapPx = 0 }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const intervalRef = useRef<number | null>(null);
  // Desktop breakpoint aligned with ResponsiveDrawer
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  // Track the computed top position so the player floats above the mobile drawer
  const [anchoredTop, setAnchoredTop] = useState<number | null>(null);
  // Track the computed left position so the player sits to the right
  // of the sidebar and any active left-side drawer on desktop
  const [anchoredLeft, setAnchoredLeft] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const hasPlaylist = videoIds && videoIds.length > 1;
  const currentVideoId = videoIds?.[currentIndex] || videoIds?.[0];
  // Prefer provided artwork. Do NOT fall back to YouTube thumbnails; show a spinner instead while loading.
  const displayArtwork = useMemo(() => {
    if (artworkUrl && artworkUrl.trim().length > 0) return artworkUrl;
    return undefined;
  }, [artworkUrl]);

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
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          setReady(true);
          setDuration(playerRef.current?.getDuration?.() || 0);
          setCurrentIndex(0);
          try {
            const data = playerRef.current?.getVideoData?.();
            if (data && typeof data.title === 'string') setVideoTitle(data.title);
          } catch {}
          if (hasPlaylist) {
            // Cue/load playlist based on autoplay
            const fn = autoplay ? 'loadPlaylist' : 'cuePlaylist';
            playerRef.current?.[fn]?.(videoIds);
          }
          try { onLoadingChange?.(false); } catch {}
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
          try {
            const data = playerRef.current?.getVideoData?.();
            if (data && typeof data.title === 'string') setVideoTitle(data.title);
          } catch {}
          if (state === 1 || state === 5) {
            try { onLoadingChange?.(false); } catch {}
          }
        },
        onError: () => {
          // If a video is blocked from embedding or unavailable, attempt to skip to the next one
          try {
            if (hasPlaylist) playerRef.current?.nextVideo?.();
          } catch {}
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
      try {
        const data = playerRef.current?.getVideoData?.();
        if (data && typeof data.title === 'string') setVideoTitle(data.title);
      } catch {}
    }, 500);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [open]);

  // Track the current top of the bottom sheet (ResponsiveDrawer) on mobile and anchor the player just above it
  useEffect(() => {
    if (!open || isDesktop) {
      setAnchoredTop(null);
      return;
    }

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        compute();
      });
    };

    const compute = () => {
      try {
        const nodes = Array.from(
          document.querySelectorAll(
            '[data-slot="drawer-content"][data-vaul-drawer-direction="bottom"]'
          )
        ) as HTMLElement[];
        if (!nodes || nodes.length === 0) {
          setAnchoredTop(null);
          return;
        }
        // Prefer an explicitly open node; otherwise take the last one
        const openNode = [...nodes].reverse().find((n) => n.getAttribute('data-state') !== 'closed');
        const el = openNode || nodes[nodes.length - 1];
        const rect = el.getBoundingClientRect();
        // Position the player above the drawer: top = drawerTop - playerHeight - offset
        const playerH = wrapperRef.current?.offsetHeight ?? 0;
        const offset = 8; // visual gap from the sheet
        const top = Math.max(8, rect.top - playerH - offset);
        setAnchoredTop(top);
      } catch {
        setAnchoredTop(null);
      }
    };

    compute();

    const onResize = () => schedule();
    window.addEventListener('resize', onResize);

    // Observe DOM mutations that indicate snap/drag state changes
    const observer = new MutationObserver(() => schedule());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'data-state']
    });

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [open, isDesktop, collapsed]);

  // Track the current left offset on desktop so the player sits to the right
  // of the sidebar and any open left-side responsive drawer
  useEffect(() => {
    if (!open || !isDesktop || !anchor.includes('left')) {
      setAnchoredLeft(null);
      return;
    }

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        compute();
      });
    };

    const compute = () => {
      try {
        // If there is an open left-side drawer, position to the right of it
        const nodes = Array.from(
          document.querySelectorAll('[data-slot="drawer-content"][data-vaul-drawer-direction="left"]')
        ) as HTMLElement[];
        const openNodes = nodes.filter((n) => n.getAttribute('data-state') !== 'closed');

        if (openNodes.length > 0) {
          // Position to the right of the rightmost open drawer
          let drawerRight = 0;
          for (const el of openNodes) {
            const rect = el.getBoundingClientRect();
            if (rect.right > drawerRight) drawerRight = rect.right;
          }
          setAnchoredLeft(drawerRight + drawerGapPx);
        } else {
          // No drawer open - use null to fall back to CSS variable
          setAnchoredLeft(null);
        }
      } catch {
        setAnchoredLeft(null);
      }
    };

    compute();

    const onResize = () => schedule();
    window.addEventListener('resize', onResize);

    // Observe DOM mutations for sidebar open/collapse and drawer state changes
    const observer = new MutationObserver(() => schedule());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'data-state']
    });

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [open, isDesktop, anchor, sidebarGapPx, drawerGapPx]);

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
    try { onLoadingChange?.(false); } catch {}
    onOpenChange(false);
  };

  // Allow selecting entity while loading by clicking the artwork/spinner
  const onArtworkClick = (e: React.MouseEvent) => {
    if (loading || !ready) {
      e.stopPropagation();
      onTitleClick?.();
      return;
    }
    togglePlay();
  };

  // Approx video height for w-[240px] with 16:9 aspect ratio
  const videoHeight = 240 * 9 / 16;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="player"
          className={`fixed z-[50] w-[240px] ${anchor.includes('left') ? 'left-4' : 'right-3'} ${(!isDesktop && anchoredTop != null) ? '' : (anchor.includes('top') ? 'top-4' : 'bottom-16')}`}
          style={{
            // On mobile, anchor above any open bottom sheet
            ...( (!isDesktop && anchoredTop != null) ? { top: anchoredTop, bottom: 'auto' as const } : {}),
            // Desktop left anchor: if a left drawer is open use measured px,
            // otherwise rely on the CSS var so it always tracks the sidebar gap.
            ...( isDesktop && anchor.includes('left')
              ? {
                  left: anchoredLeft != null
                    ? anchoredLeft
                    : `calc(var(--sidebar-gap, 0px) + ${sidebarGapPx}px)`,
                }
              : {}),
          }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26, mass: 0.6 }}
          ref={wrapperRef}
        >
      <div className="group rounded-xl border border-sidebar-border bg-popover shadow-xl overflow-hidden">
        {/* Header: visible on hover when collapsed; always visible when expanded */}
        <div className={`${collapsed ? 'sm:hidden flex group-hover:flex' : 'flex'} items-center justify-between gap-2 pl-2`}>
          {(() => {
            const headerDisplay = videoTitle || title || 'Player';
            const headerLoading = loading || !ready || !currentVideoId;
            return (
              <div className="min-w-0 flex-1 h-10 items-center flex max-w-full">
                {headerLoading ? (
                  <div className="w-full pr-2">
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : onTitleClick ? (
                  <span
                    onClick={onTitleClick}
                    title={headerDisplay}
                    className="block w-full text-left sm:text-sm text-md font-medium truncate"
                  >
                    {headerDisplay}
                  </span>
                ) : (
                  <div className="w-full text-md sm:text-sm font-medium truncate" title={headerDisplay}>{headerDisplay}</div>
                )}
              </div>
            );
          })()}
          <div className="sm:group-hover:flex sm:hidden flex items-center gap-[1px] shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed((v) => !v)} title={collapsed ? 'Expand' : 'Minimize'}>
              {collapsed ? <ChevronsUp /> : <ChevronsDown />}          
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X size={18}/>
            </Button>
          </div>
        </div>
        {/* Video: keep iframe mounted; animate collapse/expand */}
        <motion.div
          className="relative w-full bg-black overflow-hidden"
          initial={false}
          animate={{ height: collapsed ? 0 : videoHeight, opacity: collapsed ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          aria-busy={loading || !ready || !currentVideoId}
        >
          {/* YouTube player mount target */}
          <div ref={containerRef} className="w-full" style={{ height: videoHeight }} />
          {/* Centered animated Rhizome logo while player loads */}
          {(loading || !ready || !currentVideoId) && (
            <div className="absolute inset-0 grid place-items-center">
              <RhizomeLogo className="h-10 w-10 text-muted-foreground" title="Loading" animated />
            </div>
          )}
        </motion.div>
        {/* Controls */}
        <div className="pl-2 flex items-center gap-2">
          {/* Progress + Artwork with hover play/pause */}
          <div className="w-full flex items-center gap-2">
            <div
              className="relative w-6 h-6 flex-none rounded-sm overflow-hidden cursor-pointer bg-muted/20"
              onClick={onArtworkClick}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-busy={loading || !ready}
            >
              {displayArtwork ? (
                <>
                  <img
                    src={displayArtwork}
                    alt={(title || 'Track') + ' artwork'}
                    className={`w-full h-full object-cover ${!ready || loading ? 'animate-pulse' : ''}`}
                    loading="lazy"
                  />
                  <button
                    type="button"
                    className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:bg-black/30"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  >
                    {isPlaying ? <Pause size={16} className="text-white"/> : <Play size={16} className="text-white"/>}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="absolute inset-0 grid place-items-center"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                >
                  {isPlaying ? <Pause size={16} className="text-muted-foreground"/> : <Play size={16} className="text-muted-foreground"/>}
                </button>
              )}
            </div>
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-1 mb-0.5 min-w-0 overflow-hidden">
                {onTitleClick && title ? (
                  <button
                    type="button"
                    onClick={onTitleClick}
                    title={title}
                    className={`text-left flex-1 leading-4 sm:leading-normal text-md sm:text-sm font-medium text-foreground hover:underline focus:outline-none ${!ready || loading ? 'animate-pulse' : ''}`}
                  >
                    {title}
                  </button>
                ) : (
                  <span className="text-md sm:text-sm font-medium text-foreground">{title || 'Player'}</span>
                )}
                {/* Video TItle Sub-title */}
                {/* {collapsed && (
                  (loading || !ready || !currentVideoId) ? (
                   <span className="text-muted-foreground min-w-0 truncate sm:text-sm text-md">{``}</span>
                  ) : (
                    <span className="text-muted-foreground min-w-0 truncate sm:text-sm text-md">{`· ${videoTitle || ''} adfadfasd`}</span>
                  )
                )} */}
              </div>
                <Progress
                value={percent}
                className="sm:group-hover:h-2"
                onMouseDown={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
                onClick={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
                />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={next}
            disabled={!hasPlaylist}
            title="Next"
            aria-label="Next"
          >
            <SkipForward size={18} />
          </Button>
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTime(sec: number) {
  if (!sec || sec < 0 || !isFinite(sec)) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
