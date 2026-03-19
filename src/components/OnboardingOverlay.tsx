"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, Telescope, BookOpen } from "lucide-react"
import RhizomeLogo from "./RhizomeLogo"
import LastFMLogo from "@/assets/Last.fm Logo.svg"

// --- Brand icon SVGs ---

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Spotify">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function AppleMusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Apple Music">
      <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.784-.78c-.786-.198-1.578-.24-2.373-.24h-14c-.795 0-1.587.042-2.373.24a5.022 5.022 0 0 0-1.784.78C.533 1.633-.212 2.633-.01 3.943c-.198.608-.24 1.397-.24 2.181v11.74c0 .783.042 1.572.24 2.19.317 1.31 1.062 2.31 2.18 3.043a5.022 5.022 0 0 0 1.784.78c.786.198 1.578.24 2.373.24h14c.795 0 1.587-.042 2.373-.24a5.022 5.022 0 0 0 1.784-.78c1.118-.733 1.863-1.733 2.18-3.043.198-.618.24-1.407.24-2.19V6.124zm-9.57 5.77-5.334 1.76v4.91c0 .71-.578 1.28-1.287 1.28-.71 0-1.287-.57-1.287-1.28s.577-1.28 1.287-1.28c.212 0 .412.052.588.144V9.326c0-.57.393-1.065.948-1.194l6.93-1.635c.715-.168 1.437.27 1.606.984.169.715-.27 1.438-.984 1.606l-2.467.807z" />
    </svg>
  )
}

function DeezerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Deezer">
      <path d="M18.81 11.283H24v2.211h-5.19zm0 3.86H24v2.21h-5.19zm0-7.721H24v2.211h-5.19zm0-3.86H24v2.21h-5.19zM12.648 15.145h5.19v2.21h-5.19zm0-3.862h5.19v2.211h-5.19zm0 7.721h5.19v2.211h-5.19zM6.484 15.145h5.19v2.21h-5.19zm0 3.859h5.19v2.211h-5.19zm0-7.721h5.19v2.211h-5.19zM.32 15.145h5.19v2.21H.32zm0 3.859h5.19v2.211H.32z" />
    </svg>
  )
}

function TidalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Tidal">
      <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004zM8.008 16.004l-4.004-4.004L0 16.004 4.004 20.008zM16.016 11.992l-4.004 4.012 4.004 4.004L20.02 16.004zM16.016 7.996l4.004 4.004L24 7.996 19.996 3.992z" />
    </svg>
  )
}

// --- Mode icon map ---

const modeIcons: Record<string, React.ElementType> = {
  Search,
  Explore: Telescope,
  Collection: BookOpen,
}

// --- Brand icon stack ---

const brandIcons = [
  { key: "lastfm", label: "Last.fm", available: true },
  { key: "spotify", label: "Spotify", available: false },
  { key: "apple", label: "Apple Music", available: false },
  { key: "deezer", label: "Deezer", available: false },
  { key: "tidal", label: "Tidal", available: false },
] as const

function BrandIconStack() {
  return (
    <div className="flex items-center justify-center -space-x-2">
      {brandIcons.map(({ key, label, available }) => (
        <div
          key={key}
          title={available ? label : `${label} (coming soon)`}
          className={`relative size-9 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden transition-opacity ${available ? "opacity-100 z-10" : "opacity-30"}`}
          style={{ zIndex: available ? 10 : undefined }}
        >
          {key === "lastfm" && (
            <img src={LastFMLogo} alt="Last.fm" className="size-5 object-contain" />
          )}
          {key === "spotify" && <SpotifyIcon className="size-5" />}
          {key === "apple" && <AppleMusicIcon className="size-5" />}
          {key === "deezer" && <DeezerIcon className="size-5" />}
          {key === "tidal" && <TidalIcon className="size-5" />}
        </div>
      ))}
    </div>
  )
}

// ---

type ScreenMode = {
  name: string
  description: string
}

type Screen = {
  id: string
  headline: string
  body?: string
  modes?: ScreenMode[]
  video?: string
  isCTA?: boolean
}

const SCREENS: Screen[] = [
  {
    id: "hook",
    headline: "Your music has a shape.",
    body: "Streaming platforms give you a list. Rhizome gives you a map. Every genre, artist, and connection, laid out so you can see your taste all at once.",
    video: "/videos/artist-graph.mp4",
  },
  {
    id: "graph",
    headline: "Every node is a door.",
    body: "Genres branch into subgenres, cross-pollinate into fusions. Artists gravitate toward their neighbors. Click any node to go deeper.",
    video: "/videos/the-graph.mp4",
  },
  {
    id: "modes",
    headline: "Start from anywhere.",
    modes: [
      {
        name: "Search",
        description:
          "Look up any artist or genre and see the full context: genre tags, listener counts, similar artists, and more.",
      },
      {
        name: "Explore",
        description: "The full genre landscape, open for exploration.",
      },
      {
        name: "Collection",
        description: "Your saved artists, mapped. See how they connect and what's nearby.",
      },
    ],
    video: "/videos/start-from-anywhere.mp4",
  },
  {
    id: "cta",
    headline: "Ready to explore?",
    body: "Create a Rhizome account to import your listening history and see your collection mapped in the graph, or jump straight in and start from scratch.",
    isCTA: true,
  },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
  }),
}

const ctaSlideVariants = {
  enter: { y: 16, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -16, opacity: 0 },
}

const videoVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

// --- Main Component ---

interface OnboardingOverlayProps {
  onComplete: () => void
  onCreateAccount?: () => void
}

function OnboardingOverlay({ onComplete, onCreateAccount }: OnboardingOverlayProps) {
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const handleOpen = () => {
      setTimeout(() => setOpen(true), 3000)
    }
    window.addEventListener("onboarding:open", handleOpen)
    return () => {
      window.removeEventListener("onboarding:open", handleOpen)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    onComplete()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) handleClose()
  }

  const goNext = () => {
    setDirection(1)
    setCurrentIndex((i) => i + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setCurrentIndex((i) => i - 1)
  }

  const screen = SCREENS[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === SCREENS.length - 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card p-0 overflow-hidden sm:max-w-lg flex flex-col gap-0 min-h-[43rem] data-[state=open]:duration-600 data-[state=close]:duration-200">
        <DialogTitle className="sr-only">Rhizome Onboarding</DialogTitle>
        <DialogDescription className="sr-only">
          Introduction to Rhizome
        </DialogDescription>

        {/* Video hero — full-bleed, flush to top/sides */}
        <AnimatePresence initial={false}>
          {screen.video && (
            <motion.div
              key="video-hero"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden shrink-0"
            >
              <div className="relative w-full aspect-video bg-muted overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.video
                    key={screen.id}
                    src={screen.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    variants={videoVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                {/* Bottom vignette blending video into card bg */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className="flex-1 flex flex-col gap-4 px-5 pt-3 pb-5">

          {/* Logo + progress */}
          <div className="flex items-center justify-between">
            <RhizomeLogo animated className="h-9 sm:h-11 w-auto" />
            <div className="flex gap-1.5 items-center">
              {SCREENS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "w-5 bg-primary"
                      : i < currentIndex
                        ? "w-1 bg-primary/50"
                        : "w-1 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Slide content — min-h fits the tallest screen (modes) so buttons don't move */}
          <div className={`relative ${screen.isCTA ? "flex-1 flex items-center justify-center" : "min-h-[15rem]"}`}>
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={screen.id}
                  custom={direction}
                  variants={screen.isCTA ? ctaSlideVariants : slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex flex-col gap-2 ${screen.isCTA ? "w-full items-center text-center" : ""}`}
                >
                  <h2 className={`font-semibold tracking-tight leading-tight ${screen.isCTA ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>
                    {screen.headline}
                  </h2>
                  {screen.isCTA && <BrandIconStack />}
                  {screen.body && (
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {screen.body}
                    </p>
                  )}
                  {screen.isCTA && (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => { handleClose(); onCreateAccount?.() }}
                      className="mt-1"
                    >
                      Create account
                    </Button>
                  )}
                  {screen.modes && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      {screen.modes.map((mode) => {
                        const Icon = modeIcons[mode.name]
                        return (
                          <div
                            key={mode.name}
                            className="flex gap-2 items-center px-3 py-2.5 rounded-lg bg-accent/50 border border-muted/60"
                          >
                            {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
                            <span className="font-medium text-sm shrink-0 text-foreground">
                              {mode.name} —
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {mode.description}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          <motion.div layout className="flex gap-2 pt-1 mt-auto">
              <AnimatePresence mode="popLayout">
                {!isFirst && (
                  <motion.div
                    key="back-btn"
                    className="flex-1"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={isFirst ? handleClose : goBack}
                    >
                      {isFirst ? "Skip" : "Back"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout className="flex-1">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={isLast ? handleClose : goNext}
                >
                  {isLast ? "Start Exploring" : "Next"}
                </Button>
              </motion.div>
            </motion.div>

        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingOverlay
