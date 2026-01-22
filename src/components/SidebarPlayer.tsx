import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Pause, Play, ChevronsDown, ChevronsUp, X, SkipForward, Music2, Maximize2 } from "lucide-react";
import { appendYoutubeWatchURL } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import RhizomeLogo from "@/components/RhizomeLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ImageLightbox } from "@/components/ImageLightbox";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type SidebarPlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoIds: string[];
  title?: string;
  autoplay?: boolean;
  artworkUrl?: string;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  headerPreferProvidedTitle?: boolean;
  onTitleClick?: () => void;
  startIndex?: number;
  sidebarCollapsed: boolean;
  isDesktop: boolean;
  desktopSlotRef?: React.RefObject<HTMLDivElement | null>;
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

export default function SidebarPlayer({
  open,
  onOpenChange,
  videoIds,
  title,
  autoplay = true,
  artworkUrl,
  loading,
  onLoadingChange,
  headerPreferProvidedTitle,
  onTitleClick,
  startIndex = 0,
  sidebarCollapsed,
  isDesktop,
  desktopSlotRef
}: SidebarPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const mobileVideoAreaRef = useRef<HTMLDivElement | null>(null);
  const desktopVideoAreaRef = useRef<HTMLDivElement | null>(null);
  const lightboxVideoAreaRef = useRef<HTMLDivElement | null>(null);
  const [iframePosition, setIframePosition] = useState({ left: -9999, top: -9999, width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [playerCollapsed, setPlayerCollapsed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const intervalRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Track if bottom drawer is expanded beyond minimum snap on mobile
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  // Portal slot for desktop UI (to render inside sidebar while component is outside)
  const [desktopSlot, setDesktopSlot] = useState<HTMLElement | null>(null);

  // Track floating musical notes for minimal mode
  const [floatingNotes, setFloatingNotes] = useState<{ id: number; offset: number }[]>([]);
  const [notesActive, setNotesActive] = useState(false);
  const notesTimeoutRef = useRef<number | null>(null);
  const prevMinimalModeRef = useRef<boolean>(false);
  const prevPlayingRef = useRef<boolean>(false);
  const prevVideoIdsRef = useRef<string[]>([]);

  const hasPlaylist = videoIds && videoIds.length > 1;
  const currentVideoId = videoIds?.[currentIndex] || videoIds?.[0];

  const displayArtwork = useMemo(() => {
    if (artworkUrl && artworkUrl.trim().length > 0) return artworkUrl;
    return undefined;
  }, [artworkUrl]);

  const headerDisplay = useMemo(() => {
    if (headerPreferProvidedTitle && title) return title;
    return videoTitle || title || 'Player';
  }, [headerPreferProvidedTitle, title, videoTitle]);

  // Display modes (must be defined early for use in effects)
  const isMinimalMode = isDesktop && sidebarCollapsed;
  const isMobileMode = !isDesktop;
  const isFullDesktopMode = isDesktop && !sidebarCollapsed;
  const isLightboxMode = isFullDesktopMode && lightboxOpen;

  // Approx video height for different widths with 16:9 aspect ratio
  const videoHeight = isFullDesktopMode ? (208 * 9 / 16) : (375 * 9 / 16);

  useEffect(() => {
    if (!open) {
      setLightboxOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isFullDesktopMode) {
      setLightboxOpen(false);
    }
  }, [isFullDesktopMode]);

  // Find portal slot for desktop UI - use ref if provided, otherwise find by ID
  useEffect(() => {
    // If ref is provided and has current value, use it
    if (desktopSlotRef?.current) {
      setDesktopSlot(desktopSlotRef.current);
      return;
    }

    // If already found, no need to search
    if (desktopSlot) return;

    let found = false;

    const findSlot = () => {
      if (found) return true;
      // Check ref first, then fall back to ID
      const slot = desktopSlotRef?.current || document.getElementById('sidebar-player-slot');
      if (slot) {
        found = true;
        setDesktopSlot(slot);
        return true;
      }
      return false;
    };

    // Try immediately
    if (findSlot()) return;

    // Poll every 50ms until found
    const interval = setInterval(() => {
      if (findSlot()) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [desktopSlot, open, desktopSlotRef, isDesktop]);

  // Calculate iframe position based on active video area (CSS-only positioning to preserve playback)
  useEffect(() => {
    if (!open) {
      setIframePosition({ left: -9999, top: -9999, width: 0, height: 0 });
      return;
    }

    if (isMinimalMode || playerCollapsed) {
      setIframePosition({ left: -9999, top: -9999, width: 0, height: 0 });
      return;
    }

    let rafId: number;
    let positionFound = false;

    const calculatePosition = () => {
      let targetRef: HTMLDivElement | null = null;

      if (isLightboxMode && lightboxVideoAreaRef.current) {
        targetRef = lightboxVideoAreaRef.current;
      } else if (isMobileMode && mobileVideoAreaRef.current) {
        targetRef = mobileVideoAreaRef.current;
      } else if (isFullDesktopMode && desktopVideoAreaRef.current) {
        targetRef = desktopVideoAreaRef.current;
      }

      if (targetRef) {
        const rect = targetRef.getBoundingClientRect();

        // If we have valid dimensions, update position
        if (rect.width > 0 && rect.height > 0) {
          setIframePosition({
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
          });
          positionFound = true;
        }
      }

      // Keep polling until position is found
      if (!positionFound) {
        rafId = requestAnimationFrame(calculatePosition);
      }
    };

    // Start the calculation loop
    rafId = requestAnimationFrame(calculatePosition);

    // Also poll on an interval as backup (in case RAF stops)
    const pollInterval = setInterval(() => {
      if (!positionFound) {
        positionFound = false; // Reset to allow recalculation
        rafId = requestAnimationFrame(calculatePosition);
      }
    }, 100);

    // ResizeObserver to detect when video areas change size
    const resizeObserver = new ResizeObserver(() => {
      positionFound = false;
      rafId = requestAnimationFrame(calculatePosition);
    });

    // Observe refs when available - also poll for refs
    const observeRefs = () => {
      if (mobileVideoAreaRef.current) {
        resizeObserver.observe(mobileVideoAreaRef.current);
      }
      if (desktopVideoAreaRef.current) {
        resizeObserver.observe(desktopVideoAreaRef.current);
      }
      if (lightboxVideoAreaRef.current) {
        resizeObserver.observe(lightboxVideoAreaRef.current);
      }
    };
    observeRefs();

    // Also recalculate on resize/scroll
    const handleResize = () => {
      positionFound = false;
      rafId = requestAnimationFrame(calculatePosition);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(pollInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      resizeObserver.disconnect();
    };
  }, [isMinimalMode, isMobileMode, isFullDesktopMode, isLightboxMode, playerCollapsed, drawerExpanded, open, ready, desktopSlot]);

  const mountPlayer = useCallback(async () => {
    if (!containerRef.current || !open) return;
    const YT = await loadYTApi();
    // Clean existing
    if (playerRef.current) {
      try { playerRef.current.stopVideo?.(); } catch {}
      if (playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
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
          setCurrentIndex(startIndex);
          try {
            const data = playerRef.current?.getVideoData?.();
            if (data && typeof data.title === 'string') setVideoTitle(data.title);
          } catch {}
          if (hasPlaylist) {
            const fn = autoplay ? 'loadPlaylist' : 'cuePlaylist';
            playerRef.current?.[fn]?.({
              playlist: videoIds,
              index: startIndex
            });
          }
          try { onLoadingChange?.(false); } catch {}
        },
        onStateChange: (e: any) => {
          const state = e?.data;
          if (state === 1) setIsPlaying(true);
          if (state === 2 || state === 0) setIsPlaying(false);
          if (state === 0 && hasPlaylist) {
            const idx = playerRef.current?.getPlaylistIndex?.();
            if (typeof idx === 'number') setCurrentIndex(idx);
          }
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
          try {
            if (hasPlaylist) playerRef.current?.nextVideo?.();
          } catch {}
        }
      }
    });
  }, [open, videoIds, autoplay, hasPlaylist, startIndex]);

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

  // Reset derived state when a new playlist arrives
  useEffect(() => {
    if (!videoIds || videoIds.length === 0) return;
    setCurrentIndex(startIndex);
    if (!headerPreferProvidedTitle) {
      setVideoTitle("");
    }
  }, [videoIds, startIndex, headerPreferProvidedTitle]);

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
      // Also sync isPlaying state with actual player state
      const playerState = playerRef.current.getPlayerState?.();
      const actuallyPlaying = playerState === 1 || playerState === 3;
      setIsPlaying(actuallyPlaying);
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

  // Listen to ResponsiveDrawer snap changes on mobile
  useEffect(() => {
    if (!open || isDesktop) {
      setDrawerExpanded(false);
      return;
    }

    const handleSnapChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ snapIndex: number; snapPoints: number[] }>;
      const { snapIndex } = customEvent.detail;

      // snapIndex -1 = drawer closed, 0 = min snap (8%), 1+ = middle/max snaps (50%/90%)
      const isExpanded = snapIndex > 0;
      setDrawerExpanded(isExpanded);
    };

    window.addEventListener('responsiveDrawerSnapChange', handleSnapChange);

    return () => {
      window.removeEventListener('responsiveDrawerSnapChange', handleSnapChange);
    };
  }, [open, isDesktop]);

  // Helper function to activate notes for 5 seconds
  const activateNotesForDuration = useCallback(() => {
    // Clear any existing timeout
    if (notesTimeoutRef.current) {
      window.clearTimeout(notesTimeoutRef.current);
    }

    // Activate notes
    setNotesActive(true);

    // Deactivate after 5 seconds
    notesTimeoutRef.current = window.setTimeout(() => {
      setNotesActive(false);
    }, 5000);
  }, []);

  // Activate notes when entering minimal mode with music playing, or when new content selected in minimal mode
  useEffect(() => {
    const wasMinimalMode = prevMinimalModeRef.current;
    const wasPlaying = prevPlayingRef.current;
    const prevVideoIds = prevVideoIdsRef.current;

    // Update refs for next render
    prevMinimalModeRef.current = isMinimalMode;
    prevPlayingRef.current = isPlaying;
    prevVideoIdsRef.current = videoIds;

    // Don't activate on initial mount, only on state changes
    if (wasMinimalMode === false && wasPlaying === false && prevVideoIds.length === 0) {
      // This is likely the first render, skip
      return;
    }

    // Trigger notes when:
    // 1. Entering minimal mode while already playing (collapsed sidebar after selecting content)
    // 2. New content selected while already in minimal mode and playing
    if (isMinimalMode && isPlaying) {
      const justEnteredMinimalMode = !wasMinimalMode && isMinimalMode;
      const videoIdsChanged = prevVideoIds.length > 0 &&
        (prevVideoIds.length !== videoIds.length || prevVideoIds[0] !== videoIds[0]);

      if (justEnteredMinimalMode || (wasMinimalMode && videoIdsChanged)) {
        activateNotesForDuration();
      }
    }
  }, [isMinimalMode, isPlaying, videoIds, activateNotesForDuration]);

  // Spawn floating musical notes when active
  useEffect(() => {
    if (!isMinimalMode || !notesActive) {
      setFloatingNotes([]);
      return;
    }

    let noteId = 0;
    const spawnInterval = setInterval(() => {
      const newNote = {
        id: noteId++,
        offset: Math.random() * 30 - 15 // Random horizontal offset -15px to +15px
      };
      setFloatingNotes((prev) => [...prev, newNote]);

      // Remove note after animation completes
      setTimeout(() => {
        setFloatingNotes((prev) => prev.filter((n) => n.id !== newNote.id));
      }, 2000); // Match animation duration
    }, 800); // Spawn a note every 800ms

    return () => {
      clearInterval(spawnInterval);
      setFloatingNotes([]);
    };
  }, [isMinimalMode, notesActive]);

  // Cleanup notes timeout on unmount
  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        window.clearTimeout(notesTimeoutRef.current);
      }
    };
  }, []);

  const percent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    // Check actual player state to handle cases where React state hasn't synced yet
    const playerState = playerRef.current.getPlayerState?.();
    // playerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    const actuallyPlaying = playerState === 1 || playerState === 3;
    if (actuallyPlaying) {
      playerRef.current.pauseVideo?.();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo?.();
      setIsPlaying(true);
    }
  };

  const next = () => {
    if (!playerRef.current) return;
    if (hasPlaylist) playerRef.current.nextVideo?.();
  };

  const seekTo = (clientX: number, element: HTMLElement | null) => {
    if (!element || !playerRef.current || !duration) return;
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    playerRef.current.seekTo?.(ratio * duration, true);
  };

  const onClose = () => {
    try { playerRef.current?.stopVideo?.(); } catch {}
    try { onLoadingChange?.(false); } catch {}
    setLightboxOpen(false);
    onOpenChange(false);
  };

  const onArtworkClick = (e: React.MouseEvent) => {
    if (loading || !ready) {
      e.stopPropagation();
      onTitleClick?.();
      return;
    }
    togglePlay();
  };

  const onPlayerBodyClick = (e: React.MouseEvent) => {
    // On mobile, tapping the player body should expand it when collapsed
    // Don't expand if clicking on buttons or other interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (!isDesktop && playerCollapsed) {
      setPlayerCollapsed(false);
    }
  };

  // Calculate bottom position based on drawer state
  const calculateBottomPosition = () => {
    // Drawer closed or at minimum snap → 5.5rem above app bar
    // Drawer expanded (middle/max snap) → 0.75rem above drawer
    return drawerExpanded ? '0.75rem' : '5rem';
  };

  if (!open) return null;

  return (
    <>
      {/* YouTube iframe - SINGLE fixed container, CSS-positioned to preserve playback across breakpoints */}
      <div
        className="fixed overflow-hidden rounded-2xl"
        style={{
          left: `${iframePosition.left}px`,
          top: `${iframePosition.top}px`,
          width: `${iframePosition.width}px`,
          height: `${iframePosition.height}px`,
          // z-61 for mobile (above wrapper z-60), z-51 for desktop (above sidebar z-50)
          zIndex: isMobileMode ? 61 : 51,
          opacity: (isMinimalMode || playerCollapsed || iframePosition.width === 0) ? 0 : 1,
          pointerEvents: (isMinimalMode || playerCollapsed || iframePosition.width === 0) ? 'none' : 'auto',
          transition: 'opacity 0.15s ease-out',
        }}
        aria-hidden={isMinimalMode || playerCollapsed}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/*
      * Minimal thumbnail mode (desktop + sidebar collapsed) - rendered into sidebar via portal
      */}
      {desktopSlot && isMinimalMode && createPortal(
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <motion.div
              key="player-minimal"
              className="w-full flex justify-center pb-2 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              // onMouseEnter={activateNotesForDuration}
            >
              {/* Floating musical notes */}
              <AnimatePresence>
                {floatingNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    className="absolute pointer-events-none"
                    style={{ left: `calc(50% + ${note.offset}px)` }}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: -60,
                      scale: [0.5, 1, 1, 0.8],
                      rotate: [0, 10, -10, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 2,
                      ease: "easeOut",
                      times: [0, 0.2, 0.8, 1]
                    }}
                  >
                    <Music2 size={16} className="text-primary/60" />
                  </motion.div>
                ))}
              </AnimatePresence>

              <div
                className="relative w-12 h-12 rounded-md overflow-hidden cursor-pointer bg-muted/20 group shadow-lg"
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
                      className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:bg-black/40"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    >
                      {isPlaying ? <Pause size={20} className="text-white"/> : <Play size={20} className="text-white"/>}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="absolute inset-0 grid place-items-center bg-muted/10"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  >
                    {loading || !ready ? (
                      <RhizomeLogo className="h-6 w-6 text-muted-foreground" animated />
                    ) : (
                      isPlaying ? <Pause size={20} className="text-muted-foreground"/> : <Play size={20} className="text-muted-foreground"/>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{videoTitle}</p>
          </TooltipContent>
        </Tooltip>,
        desktopSlot
      )}

      {/* 
      * Mobile mode backdrop - only show when player is expanded 
      */}
      {isMobileMode && !playerCollapsed && (
        <motion.div
          key="player-backdrop"
          className="fixed inset-0 bg-overlay backdrop-blur-sm z-[59]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setPlayerCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* 
      Mobile mode (floating above MobileAppBar) 
      */}
      <motion.div
        key="player-mobile"
        className={`fixed max-w-[400px] z-[60] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] ${isMobileMode ? '' : 'hidden'}`}
        initial={{ opacity: 0, y: 12, scale: 0.98, bottom: '1rem' }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          bottom: calculateBottomPosition()
        }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26, mass: 0.6 }}
        ref={wrapperRef}
        aria-hidden={!isMobileMode}
      >
        <div
          className={`group p-2 border bg-popover shadow-xs overflow-hidden ${playerCollapsed ? 'cursor-pointer rounded-full' : 'rounded-3xl'}`}
          onClick={onPlayerBodyClick}
        >
          {/* Header (collapse/close buttons) - shown above player when expanded */}
          <div className={`${playerCollapsed ? 'hidden' : 'flex'} absolute right-0 -top-12 items-center justify-between gap-2`}>
            <div className="flex items-center gap-4 shrink-0">
              <Button variant="secondary" size="icon" onClick={() => setPlayerCollapsed((v) => !v)} title={playerCollapsed ? 'Expand' : 'Minimize'}>
                {playerCollapsed ? <ChevronsUp /> : <ChevronsDown />}
              </Button>
              <Button variant="secondary" size="icon" onClick={onClose} title="Close">
                <X size={18}/>
              </Button>
            </div>
          </div>

          {/* Video area - position target for CSS-positioned iframe */}
          <motion.div
            ref={mobileVideoAreaRef}
            className={`relative w-full rounded-2xl bg-black overflow-hidden ${playerCollapsed ? '' : 'mb-2'}`}
            initial={false}
            animate={{ height: playerCollapsed ? 0 : videoHeight, opacity: playerCollapsed ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            aria-busy={loading || !ready || !currentVideoId}
          >
            {(loading || !ready || !currentVideoId) && (
              <div className="absolute inset-0 grid place-items-center">
                <RhizomeLogo className="h-10 w-10 text-muted-foreground" title="Loading" animated />
              </div>
            )}
          </motion.div>

          {/* Controls */}
          <div className="pl-2 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {/* Artwork with play/pause */}
              <div
                className="relative w-10 h-10 flex-none rounded-md overflow-hidden cursor-pointer bg-muted/20"
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
                      {isPlaying ? <Pause size={18} className="text-white"/> : <Play size={18} className="text-white"/>}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="absolute inset-0 grid place-items-center"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  >
                    {isPlaying ? <Pause size={18} className="text-muted-foreground"/> : <Play size={18} className="text-muted-foreground"/>}
                  </button>
                )}
              </div>

              {/* Track info */}
              <div className="flex flex-col leading-tight truncate min-w-0 flex-1 text-sm font-medium text-foreground">
                {playerCollapsed
                ? <div className="block text-left min-w-0 truncate">
                    <span className="text-foreground">{videoTitle || 'Loading...'}</span>
                  </div>
                :
                <button
                  type="button"
                  onClick={(e) => {e.stopPropagation(); onTitleClick?.()}}
                  title={videoTitle}
                  className={`block text-left min-w-0 truncate hover:underline focus:outline-none ${!ready || loading ? 'animate-pulse' : ''}`}
                >
                  <span className="text-foreground">{videoTitle || 'Loading...'}</span>
                </button>
                }
                <span className="text-muted-foreground min-w-0 truncate leading-tight text-sm">{title || ''}</span>
              </div>

              {/* Play controls */}
              <div className="flex gap-2 shrink-0">
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button> */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  disabled={!hasPlaylist}
                  title="Next"
                  aria-label="Next"
                >
                  <SkipForward size={20} />
                </Button>
                {/* {playerCollapsed && <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                <X size={18}/>
              </Button>} */}
              </div>
            </div>

            {/* Progress bar - only show when expanded */}
            {!playerCollapsed && (
              <Progress
                value={percent}
                className="h-2 my-2"
                onMouseDown={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
                onClick={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/*
      * Full desktop mode (sidebar expanded) - rendered into sidebar via portal
      */}
      {desktopSlot && createPortal(
        <motion.div
          key="player-desktop"
          className={`w-full px-1 mb-2 ${isFullDesktopMode ? '' : 'hidden'}`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          aria-hidden={!isFullDesktopMode}
        >
      <div className="group/player rounded-xl border border-sidebar-border bg-popover shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pl-2">
          <div className="min-w-0 flex-1 h-10 items-center flex max-w-full">
            {(loading || !ready || !currentVideoId) ? (
              <div className="w-full pr-2">
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : onTitleClick ? (
              <span
                onClick={onTitleClick}
                title={videoTitle || 'Loading...'}
                className="block w-full text-left text-sm font-medium truncate cursor-pointer hover:underline"
              >
                {videoTitle || 'Loading...'}
                {/* {headerDisplay} */}
              </span>
            ) : (
              <div className="w-full text-sm font-medium truncate" title={headerDisplay}>{headerDisplay}</div>
            )}
          </div>
          <div className="group-hover/player:flex hidden items-center gap-[1px] shrink-0">
            {/* <Button variant="ghost" size="icon" onClick={() => setPlayerCollapsed((v) => !v)} title={playerCollapsed ? 'Expand' : 'Minimize'}>
              {playerCollapsed ? <ChevronsUp /> : <ChevronsDown />}
            </Button> */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightboxOpen(true)}
              title="Expand"
              aria-label="Expand"
            >
              <Maximize2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X size={18}/>
            </Button>
          </div>
        </div>
        {/* Video area - position target for CSS-positioned iframe */}
        <motion.div
          ref={desktopVideoAreaRef}
          className="relative w-full bg-black overflow-hidden"
          initial={false}
          animate={{ height: playerCollapsed ? 0 : videoHeight, opacity: playerCollapsed ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          aria-busy={loading || !ready || !currentVideoId}
        >
          {(loading || !ready || !currentVideoId) && (
            <div className="absolute inset-0 grid place-items-center">
              <RhizomeLogo className="h-10 w-10 text-muted-foreground" title="Loading" animated />
            </div>
          )}
        </motion.div>
        {/* Controls */}
        <div className="pl-2 flex items-center gap-2">
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
                    className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity group-hover/player:opacity-100 group-hover:bg-black/30"
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
              <div className="flex items-center gap-1 pb-1 min-w-0 overflow-hidden">
                {onTitleClick && title ? (
                  <button
                    type="button"
                    onClick={onTitleClick}
                    title={title}
                    className={`text-left flex-1 leading-none text-sm font-medium text-foreground hover:underline focus:outline-none ${!ready || loading ? 'animate-pulse' : ''}`}
                  >
                    {title}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-foreground">{headerDisplay}</span>
                )}
              </div>
              <Progress
                value={percent}
                className="group-hover/player:h-2"
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
        </motion.div>,
        desktopSlot
      )}

      {isDesktop && (
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          showCloseButton={false}
          bodyClassName="flex justify-center px-4"
        >
          <div className="w-full max-w-[960px] rounded-3xl border border-border bg-popover shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                {onTitleClick ? (
                  <button
                    type="button"
                    onClick={onTitleClick}
                    title={headerDisplay}
                    className={`text-left text-lg font-semibold truncate hover:underline focus:outline-none ${!ready || loading ? 'animate-pulse' : ''}`}
                  >
                    {headerDisplay}
                  </button>
                ) : (
                  <div className="text-lg font-semibold truncate" title={headerDisplay}>
                    {headerDisplay}
                  </div>
                )}
                {title && headerDisplay !== title && (
                  <div className="text-sm text-muted-foreground truncate">{title}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxOpen(false)}
                title="Close"
                aria-label="Close"
              >
                <X size={18} />
              </Button>
            </div>
            <div
              ref={lightboxVideoAreaRef}
              className="relative w-full bg-black"
              style={{ aspectRatio: "16 / 9" }}
              aria-busy={loading || !ready || !currentVideoId}
            >
              {(loading || !ready || !currentVideoId) && (
                <div className="absolute inset-0 grid place-items-center">
                  <RhizomeLogo className="h-10 w-10 text-muted-foreground" title="Loading" animated />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Button
                variant="secondary"
                size="icon"
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <Progress
                value={percent}
                className="h-2 flex-1"
                onMouseDown={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
                onClick={(e) => seekTo(e.clientX, e.currentTarget as HTMLElement)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={next}
                disabled={!hasPlaylist}
                title="Next"
                aria-label="Next"
              >
                <SkipForward size={18} />
              </Button>
            </div>
          </div>
        </ImageLightbox>
      )}
    </>
  );
}
