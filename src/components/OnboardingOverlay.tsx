"use client"

import { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Waypoints, Disc3, Sparkles, Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/Loading"
import { toast } from "sonner"
import RhizomeLogo from "./RhizomeLogo"
import LastFMLogo from "@/assets/Last.fm Logo.svg"
import {
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import type { LastFMAccountPreview } from "@/types"

const TOTAL_STEPS = 3

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

function ConnectMusicStep({
  onNext,
  onSkip,
  onLastFMPreview,
  onLastFMConnect,
}: {
  onNext: () => void
  onSkip: () => void
  onLastFMPreview: (lfmUsername: string) => Promise<LastFMAccountPreview>
  onLastFMConnect: (lfmUsername: string) => Promise<boolean>
}) {
  const [lfmUsername, setLfmUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<LastFMAccountPreview | undefined>()
  const [connectSuccess, setConnectSuccess] = useState(false)

  const handlePreview = async () => {
    if (!lfmUsername) {
      toast.error("Please enter a Last.fm username")
      return
    }
    setLoading(true)
    const result = await onLastFMPreview(lfmUsername)
    setLoading(false)
    if (result) {
      setPreview(result)
    } else {
      toast.error("Unable to find Last.fm account")
    }
  }

  const handleConnect = async () => {
    if (!preview?.lfmUsername) return
    setLoading(true)
    const success = await onLastFMConnect(preview.lfmUsername)
    setLoading(false)
    if (success) {
      toast.success("Successfully connected to Last.fm!")
      setConnectSuccess(true)
    } else {
      toast.error("Unable to connect to Last.fm")
    }
  }

  const handleBack = () => {
    if (preview && !connectSuccess) {
      setPreview(undefined)
    }
  }

  return (
    <div className="grid gap-6">
      <DialogHeader>
        <DialogTitle className="sm:text-2xl text-xl text-center">
          Import Your Music
        </DialogTitle>
        <DialogDescription className="text-md text-center">
          Sync your scrobbled artists from Last.fm directly into your collection.
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="animate-spin size-6 text-muted-foreground" />
        </div>
      ) : connectSuccess ? (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-6 text-primary" />
          </div>
          <p className="font-medium">Last.fm Connected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your scrobbled artists are being imported.
          </p>
        </div>
      ) : preview ? (
        <div className="grid gap-3">
          <div className="p-4 rounded-xl bg-accent dark:bg-accent/50 border border-muted dark:border-accent">
            <p className="text-sm">
              Account <strong>{preview.lfmUsername}</strong> found with{" "}
              <strong>{preview.totalArtists}</strong> artists.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Top artists: {preview.topArtists.join(", ")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Connecting will import your scrobbled artists into your collection.
            This could take some time if you have thousands of artists!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 p-3 rounded-xl bg-accent dark:bg-accent/50 border border-muted dark:border-accent">
            <div className="flex gap-4 items-center">
              <img aria-hidden="true" src={LastFMLogo} className="size-8" />
              <div className="flex-1">
                <p className="font-medium text-sm">Last.fm</p>
                <p className="text-sm text-muted-foreground">
                  Sync your scrobbled artists into your collection
                </p>
              </div>
            </div>
            <Input
              id="onboarding-lfm-username"
              type="text"
              placeholder="Your Last.fm username"
              value={lfmUsername}
              onChange={(e) => setLfmUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handlePreview()
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 w-full">
        {connectSuccess ? (
          <Button size="lg" className="flex-1" onClick={onNext}>
            Continue
          </Button>
        ) : preview ? (
          <>
            <Button variant="outline" size="lg" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={handleConnect}>
              Connect
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="lg" className="flex-1" onClick={onSkip}>
              Skip
            </Button>
            <Button size="lg" className="flex-1" onClick={handlePreview}>
              Find Last.fm Account
            </Button>
          </>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Want to connect Spotify, Apple Music, or something else?{" "}
        <a
          href="https://tally.so/r/obEpvO"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          Let us know!
        </a>
      </p>
    </div>
  )
}


// --- Main Component ---

interface OnboardingOverlayProps {
  onLastFMPreview: (lfmUsername: string) => Promise<LastFMAccountPreview>
  onLastFMConnect: (lfmUsername: string) => Promise<boolean>
  isLfmConnected: boolean
  onComplete: () => void
}

function OnboardingOverlay({
  onLastFMPreview,
  onLastFMConnect,
  isLfmConnected,
  onComplete,
}: OnboardingOverlayProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const handleOpen = () => {
      setStep(0)
      setOpen(true)
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

  // Build the active steps list, skipping steps where state is already satisfied
  const getSteps = () => {
    const steps: string[] = ["welcome"]
    if (!isLfmConnected) steps.push("connect")
    return steps
  }

  const steps = getSteps()
  const currentStepName = steps[step] || "completion"

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const skipToEnd = () => {
    setStep(steps.length - 1)
  }

  const renderStep = () => {
    switch (currentStepName) {
      case "welcome":
        return <WelcomeStep onNext={goNext} onSkip={goNext} />
      case "connect":
        return (
          <ConnectMusicStep
            onNext={handleClose}
            onSkip={handleClose}
            onLastFMPreview={onLastFMPreview}
            onLastFMConnect={onLastFMConnect}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-8rem)] overflow-y-auto sm:max-w-2xl h-auto flex flex-col"
      >
        {/* Step indicators */}
        {currentStepName !== "welcome" && currentStepName !== "completion" && (
          <div className="flex justify-center gap-1.5 mb-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === step
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Screen-reader title for non-welcome steps */}
        {currentStepName !== "welcome" && currentStepName !== "completion" && (
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
        )}
        {currentStepName !== "welcome" && (
          <DialogDescription className="sr-only">
            Get started with Rhizome
          </DialogDescription>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStepName}
            {...fadeTransition}
            className={
              "flex-1 min-h-0"
                
            }
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingOverlay
