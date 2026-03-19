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
import RhizomeLogo from "./RhizomeLogo"

type ScreenMode = {
  name: string
  description: string
}

type Screen = {
  id: string
  headline: string
  body?: string
  modes?: ScreenMode[]
  video: string
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
    video: "/videos/onboarding-explore.mp4",
  },
  {
    id: "cta",
    headline: "Ready to explore?",
    body: "Create a Rhizome account to import your listening history and see your collection mapped in the graph, or jump straight in and start from scratch.",
    video: "/videos/onboarding-explore.mp4",
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
      <DialogContent className="bg-card p-0 overflow-hidden sm:max-w-lg flex flex-col gap-0 data-[state=open]:duration-600 data-[state=close]:duration-200">
        <DialogTitle className="sr-only">Rhizome Onboarding</DialogTitle>
        <DialogDescription className="sr-only">
          Introduction to Rhizome
        </DialogDescription>

        {/* Video hero — full-bleed, flush to top/sides */}
        <div className="relative w-full aspect-video bg-muted shrink-0 overflow-hidden">
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

        {/* Content area */}
        <div className="flex flex-col gap-4 px-5 pt-3 pb-5">

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
          <div className="relative min-h-[15rem]">
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={screen.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col gap-2"
                >
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                    {screen.headline}
                  </h2>
                  {screen.body && (
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {screen.body}
                    </p>
                  )}
                  {screen.isCTA && (
                    <Button
                      variant="link"
                      onClick={() => { handleClose(); onCreateAccount?.() }}
                      className="w-auto self-start"
                    >
                      Create account →
                    </Button>
                  )}
                  {screen.modes && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      {screen.modes.map((mode) => (
                        <div
                          key={mode.name}
                          className="flex gap-2 items-baseline px-3 py-2.5 rounded-lg bg-accent/50 border border-muted/60"
                        >
                          <span className="font-medium text-sm shrink-0 text-foreground">
                            {mode.name} —
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {mode.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          <motion.div layout className="flex gap-2 pt-1">
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
                      onClick={goBack}
                    >
                      Back
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
