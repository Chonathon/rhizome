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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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
      <path d="M23.994 6.124a9.2 9.2 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5 5 0 0 0-1.877-.726a10.5 10.5 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986q-.227.014-.455.026c-.747.043-1.49.123-2.193.4c-1.336.53-2.3 1.452-2.865 2.78c-.192.448-.292.925-.363 1.408a11 11 0 0 0-.1 1.18c0 .032-.007.062-.01.093v12.223l.027.424c.05.815.154 1.624.497 2.373c.65 1.42 1.738 2.353 3.234 2.801c.42.127.856.187 1.293.228c.555.053 1.11.06 1.667.06h11.03a13 13 0 0 0 1.57-.1c.822-.106 1.596-.35 2.295-.81a5.05 5.05 0 0 0 1.88-2.207c.186-.42.293-.87.37-1.324c.113-.675.138-1.358.137-2.04c-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206c-.29.59-.76.962-1.388 1.14q-.524.15-1.07.173c-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 0 1 1.038-2.022c.323-.16.67-.25 1.018-.324c.378-.082.758-.153 1.134-.24c.274-.063.457-.23.51-.516a1 1 0 0 0 .02-.193q0-2.723-.002-5.443a.7.7 0 0 0-.026-.185c-.04-.15-.15-.243-.304-.234c-.16.01-.318.035-.475.066q-1.14.226-2.28.456l-2.325.47l-1.374.278l-.048.013c-.277.077-.377.203-.39.49q-.002.063 0 .13c-.002 2.602 0 5.204-.003 7.805c0 .42-.047.836-.215 1.227c-.278.64-.77 1.04-1.434 1.233q-.526.152-1.075.172c-.96.036-1.755-.6-1.92-1.544c-.14-.812.23-1.685 1.154-2.075c.357-.15.73-.232 1.108-.31c.287-.06.575-.116.86-.177q.574-.126.6-.714v-.15l.002-8.882c0-.123.013-.25.042-.37c.07-.285.273-.448.546-.518c.255-.066.515-.112.774-.165q1.1-.224 2.2-.444l2.27-.46l2.01-.403c.22-.043.442-.088.663-.106c.31-.025.523.17.554.482q.012.11.012.223q.003 2.866 0 5.732z"/>
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
      {brandIcons.map(({ key, label, available }, i) => {
        const icon = (
          <div
            style={{ zIndex: brandIcons.length - i }}
            className={`relative size-9 rounded-full border border-border flex items-center justify-center overflow-hidden ${available ? "bg-accent" : "bg-card"}`}
          >
            {key === "lastfm" && (
              <img src={LastFMLogo} alt="Last.fm" className="size-5 object-contain" />
            )}
            {key === "spotify" && <SpotifyIcon className={`size-5 ${available ? "" : "opacity-30"}`} />}
            {key === "apple" && <AppleMusicIcon className={`size-5 ${available ? "" : "opacity-30"}`} />}
            {key === "deezer" && <DeezerIcon className={`size-5 ${available ? "" : "opacity-30"}`} />}
            {key === "tidal" && <TidalIcon className={`size-5 ${available ? "" : "opacity-30"}`} />}
          </div>
        )

        if (!available) {
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>{icon}</TooltipTrigger>
              <TooltipContent>{label} — coming soon</TooltipContent>
            </Tooltip>
          )
        }

        return <div key={key}>{icon}</div>
      })}
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
  enter: { y: 12, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -12, opacity: 0 },
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
    setCurrentIndex((i) => i + 1)
  }

  const goBack = () => {
    setCurrentIndex((i) => i - 1)
  }

  const screen = SCREENS[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === SCREENS.length - 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card p-0 overflow-hidden sm:max-w-lg flex flex-col gap-0 min-h-[46rem] data-[state=open]:duration-600 data-[state=close]:duration-200">
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
            <AnimatePresence mode="wait">
                <motion.div
                  key={screen.id}
                  variants={slideVariants}
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
                    <div className="flex flex-col gap-1 mt-1">
                      {screen.modes.map((mode) => {
                        const Icon = modeIcons[mode.name]
                        return (
                          <div
                            key={mode.name}
                            className="flex flex-col items-start px-3 py-2.5 rounded-lg bg-accent/50 border border-muted/60"
                          >
                            <div className="flex gap-2 items-center mb-1">
                              {Icon && <Icon className="size-5 text-foreground shrink-0" />}
                              <span className=" font-medium text-md shrink-0 text-foreground">
                                {mode.name}
                              
                              </span>
                            </div>
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
                {!isLast && (
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
