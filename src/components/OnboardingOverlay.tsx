"use client"

import { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Waypoints, Disc3, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import RhizomeLogo from "./RhizomeLogo"

const fadeTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" as const },
}

// --- Step Components ---

const WELCOME_FEATURES = [
  {
    icon: Waypoints,
    title: "Explore Your Graph",
    description:
      "Your collection comes to life as an interactive force-graph. See how genres, artists, and their relationships connect.",
    video: "/videos/onboarding-explore.mp4",
  },
  {
    icon: Disc3,
    title: "Build Your Collection",
    description:
      "Add genres to your collection and discover the artists within them. Your graph grows with every addition.",
    video: "/videos/onboarding-explore.mp4",
  },
  {
    icon: Sparkles,
    title: "Discover New Music",
    description:
      "Follow the connections between artists and genres to find music you never knew you'd love.",
    video: "/videos/onboarding-explore.mp4",
  },
]

function WelcomeStep({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFeature = WELCOME_FEATURES[activeIndex]
  const featureRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    featureRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [activeIndex])

  const handleNext = () => {
    if (activeIndex < WELCOME_FEATURES.length - 1) {
      setActiveIndex(activeIndex + 1)
    } else {
      onNext()
    }
  }

  const isLastFeature = activeIndex === WELCOME_FEATURES.length - 1

  return (
    <div className="flex flex-col gap-4 h-full">
      <DialogHeader>
        <div>
          <RhizomeLogo animated className="mx-auto mb-2 h-11 sm:h-14 w-auto" />
        </div>
        <DialogTitle className="text-2xl sm:text-3xl text-center">
          Welcome to Rhizome
        </DialogTitle>
        <DialogDescription className="text-md text-center">
          A living map of artists, genres, and connections you never noticed.
        </DialogDescription>
      </DialogHeader>

      {/* Horizontal scrolling feature cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:justify-center snap-x snap-mandatory">
        {WELCOME_FEATURES.map((feature, index) => {
          const isActive = index === activeIndex
          return (
            <button
              ref={(el) => { featureRefs.current[index] = el }}
              key={feature.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`flex gap-2 items-center p-3 rounded-xl text-left shrink-0 snap-center transition-all duration-200 ${
                isActive
                  ? "bg-accent dark:bg-accent/50 border border-primary/40 shadow-sm"
                  : "border border-transparent hover:bg-accent/50"
              }`}
            >
              <feature.icon
                className={`size-4 shrink-0 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <p
                className={`font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {feature.title}
              </p>
            </button>
          )
        })}
      </div>

      {/* Video + description */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature.video}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="max-w-2xl w-full max-h-full rounded-2xl overflow-hidden border border-muted"
          >
            <video
              key={activeFeature.video}
              src={activeFeature.video}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-auto block"
            />
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-muted-foreground text-center mt-4 max-w-2xl min-h-[2lh]"
          >
            {activeFeature.description}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex w-full gap-2 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onSkip}
        >
          Skip
        </Button>
        <Button size="lg" className="flex-1" onClick={handleNext}>
          {isLastFeature ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  )
}


// --- Main Component ---

interface OnboardingOverlayProps {
  onComplete: () => void
}

function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => {
      setTimeout(() => setOpen(true), 5000)
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
    if (!nextOpen) {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-8rem)] overflow-y-auto sm:max-w-2xl h-auto flex flex-col data-[state=open]:duration-600 data-[state=close]:duration-200"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="welcome"
            {...fadeTransition}
            className="flex-1 min-h-0"
          >
            <WelcomeStep onNext={handleClose} onSkip={handleClose} />
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingOverlay
