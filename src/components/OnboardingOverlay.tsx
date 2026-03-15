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
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loading } from "@/components/Loading"
import { toast } from "sonner"
import RhizomeLogo from "./RhizomeLogo"
import LastFMLogo from "@/assets/Last.fm Logo.svg"
import {
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import type { LastFMAccountPreview, Social } from "@/types"

const TOTAL_STEPS = 3

const fadeTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" as const },
}

// --- Step Components ---

function WelcomeStep({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  const features = [
    {
      icon: Waypoints,
      title: "Explore Your Graph",
      description:
        "Your collection comes to life as an interactive force-graph. See how genres, artists, and their relationships connect.",
    },
    {
      icon: Disc3,
      title: "Build Your Collection",
      description:
        "Add genres to your collection and discover the artists within them. Your graph grows with every addition.",
    },
    {
      icon: Sparkles,
      title: "Discover New Music",
      description:
        "Follow the connections between artists and genres to find music you never knew you'd love.",
    },
  ]

  return (
    <div className="grid gap-6">
      <DialogHeader>
        <div>
          <RhizomeLogo animated className="mx-auto mb-4 h-11 sm:h-14 w-auto" />
        </div>
        <DialogTitle className="sm:text-3xl text-2xl text-center">
          Welcome to Rhizome
        </DialogTitle>
        <DialogDescription className="text-md text-center">
          A living map of artists, genres, and connections you never noticed.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-4 items-start p-3 rounded-xl bg-accent dark:bg-accent/50 border border-muted dark:border-accent"
          >
            <div className="flex-shrink-0 mt-0.5">
              <feature.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{feature.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onNext}>
          Get Started
        </Button>
        <Button variant="ghost" size="sm" className="w-full" onClick={onSkip}>
          Skip
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
          <div className="flex gap-4 items-center p-3 rounded-xl bg-accent dark:bg-accent/50 border border-muted dark:border-accent">
            <img aria-hidden="true" src={LastFMLogo} className="size-8" />
            <div className="flex-1">
              <p className="font-medium text-sm">Last.fm</p>
              <p className="text-sm text-muted-foreground">
                Sync your scrobbled artists into your collection
              </p>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="onboarding-lfm-username">Last.fm Username</Label>
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

      <div className="flex flex-col gap-2">
        {connectSuccess ? (
          <Button size="lg" className="w-full" onClick={onNext}>
            Continue
          </Button>
        ) : preview ? (
          <>
            <Button size="lg" className="w-full" onClick={handleConnect}>
              Connect
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={handleBack}>
              Back
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={handlePreview}>
              Find Last.fm Account
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={onSkip}>
              Skip
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

function CreateAccountStep({
  onNext,
  onSkip,
  onSignUp,
  onSignInSocial,
}: {
  onNext: () => void
  onSkip: () => void
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>
  onSignInSocial: (social: Social) => Promise<boolean>
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onSignUp(email, password, email.split("@")[0])
    if (success) {
      toast.success("Account created!")
      onNext()
    } else {
      toast.error("Error creating account")
    }
  }

  const handleSocial = async (social: Social) => {
    const success = await onSignInSocial(social)
    if (success) {
      toast.success("Account connected!")
      onNext()
    }
  }

  return (
    <div className="grid gap-6">
      <DialogHeader>
        <DialogTitle className="sm:text-2xl text-xl text-center">
          Save Your Collection
        </DialogTitle>
        <DialogDescription className="text-md text-center">
          Create a free account to keep your genres, artists, and connections across sessions.
        </DialogDescription>
      </DialogHeader>

      {/* OAuth */}
      <div className="flex flex-row gap-4">
        <Button
          className="w-full p-4 flex-1"
          variant="outline"
          size="xl"
          type="button"
          onClick={() => handleSocial("google")}
        >
          <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"/><path fill="#e33629" d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21"/><path fill="#f8bd00" d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9"/><path fill="#587dbd" d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68"/><path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4"/></svg>
        </Button>
        <Button
          className="w-full p-4 flex-1"
          variant="outline"
          size="xl"
          type="button"
          onClick={() => handleSocial("spotify")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
              fill="#1DB954"
            />
          </svg>
        </Button>
      </div>

      {/* Divider */}
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          Or continue with email
        </span>
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="onboarding-email">Email</Label>
            <Input
              id="onboarding-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="onboarding-password">Password</Label>
            <Input
              id="onboarding-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full mt-2">
            Create Account
          </Button>
        </div>
      </form>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  )
}

function CompletionStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="grid gap-6 text-center">
      <DialogHeader>
        <div>
          <RhizomeLogo animated className="mx-auto mb-4 h-11 sm:h-14 w-auto" />
        </div>
        <DialogTitle className="sm:text-2xl text-xl text-center">
          You're all set!
        </DialogTitle>
        <DialogDescription className="text-md text-center">
          Start exploring — add your first genre to begin building your collection.
        </DialogDescription>
      </DialogHeader>
      <Button size="lg" className="w-full" onClick={onFinish}>
        Start Exploring
      </Button>
    </div>
  )
}

// --- Main Component ---

interface OnboardingOverlayProps {
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>
  onSignInSocial: (social: Social) => Promise<boolean>
  onLastFMPreview: (lfmUsername: string) => Promise<LastFMAccountPreview>
  onLastFMConnect: (lfmUsername: string) => Promise<boolean>
  isLoggedIn: boolean
  isLfmConnected: boolean
  onComplete: () => void
}

function OnboardingOverlay({
  onSignUp,
  onSignInSocial,
  onLastFMPreview,
  onLastFMConnect,
  isLoggedIn,
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
    if (!isLoggedIn) steps.push("account")
    steps.push("completion")
    return steps
  }

  const steps = getSteps()
  const currentStepName = steps[step] || "completion"
  const progressValue = ((step + 1) / steps.length) * 100

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
            onNext={goNext}
            onSkip={goNext}
            onLastFMPreview={onLastFMPreview}
            onLastFMConnect={onLastFMConnect}
          />
        )
      case "account":
        return (
          <CreateAccountStep
            onNext={goNext}
            onSkip={goNext}
            onSignUp={onSignUp}
            onSignInSocial={onSignInSocial}
          />
        )
      case "completion":
        return <CompletionStep onFinish={handleClose} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card h-[calc(100%-.8rem)] overflow-y-auto sm:max-w-[calc(100%-.8rem)] "
      >
        {/* Progress bar */}
        {currentStepName !== "welcome" && currentStepName !== "completion" && (
          <Progress value={progressValue} className="mb-2" />
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
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingOverlay
