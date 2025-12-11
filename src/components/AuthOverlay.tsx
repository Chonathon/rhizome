import { useEffect, useState, useRef, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import RhizomeLogo from "./RhizomeLogo";
import { useMediaQuery } from "@/hooks/use-media-query";
import {Social} from "@/types";
import * as React from "react";

type AuthMode = "signup" | "login";
interface AuthOverlayProps {
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>;
  onSignInSocial: (social: Social) => Promise<boolean>;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onForgotPassword: (email: string) => Promise<boolean>;
}

function AuthOverlay({onSignUp, onSignInSocial, onSignIn, onForgotPassword}: AuthOverlayProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const handleOpen = (event: Event) => {
      setOpen(true);
      const customEvent = event as CustomEvent<{ mode?: AuthMode }>;
      setMode(customEvent.detail?.mode ?? "signup");
    };
    window.addEventListener("auth:open", handleOpen);
    return () => {
      window.removeEventListener("auth:open", handleOpen);
    };
  }, []);

  const emailRef = useRef<HTMLInputElement>(null);

  const isSignup = mode === "signup";
  const appleLabel = isMobile || !isSignup ? "" : isSignup ? "Sign up with Apple" : "Log in with Apple";
  const googleLabel = isMobile || !isSignup ? "" : isSignup ? "Sign up with Google" : "Log in with Google";
  const spotifyLabel = isMobile || !isSignup ? "" : isSignup ? "Sign up with Spotify" : "Log in with Spotify";
  const primaryButtonLabel = isSignup ? "Continue" : "Log in";
  const appleToast = isSignup ? "Apple sign-up not yet implemented 🙃" : "Apple log in not yet implemented 🙃";
  const footerPrompt = isSignup ? "Already have an account?" : "Need an account?";
  const footerAction = isSignup ? "Log in" : "Sign up";
  const footerMode: AuthMode = isSignup ? "login" : "signup";
  const signupDescription = (
    <>
      Add artists to your collection from Rhizome, or import your entire library from{" "}
      <strong>Last.FM</strong>, <strong>Deezer</strong>, <strong>Spotify</strong>, and more... soon!
    </>
  );
  const loginDescription = <>Welcome back. Feel free to pick up where you left off.</>;
  const nextDescription = isSignup ? signupDescription : loginDescription;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setMode("signup");
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let success = false;
    if (isSignup) {
      success = await onSignUp(email, password, email.split('@')[0]);
      if (success) {
        toast.success("Successfully signed up!");
      } else {
        toast.error("Error creating account!");
      }
    } else {
      success = await onSignIn(email, password);
      if (success) {
        toast.success("Successfully logged in!");
      } else {
        toast.error("Incorrect email or password!");
      }
    }
    if (success) setOpen(false);
  };

  const forgotPassword = async () => {
    const success = await onForgotPassword(email);
    if (success) {
      toast.success("An email has been sent to reset your password.");
    } else {
      toast.error("Email not found.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          emailRef.current?.focus();
        }}
      >
        <div>
          <DialogHeader>
            <div>
              <RhizomeLogo className="mx-auto mb-4 h-11 sm:h-14 w-auto" />
            </div>
            <DialogTitle className="sm:text-3xl text-2xl text-center">
              {isSignup ? "Create a free account to start your collection" : "Log in to continue your collection"}
            </DialogTitle>
            <DialogDescription className="relative text-md text-center">
              <span aria-hidden="true" className="block select-none opacity-0 pointer-events-none">
                {nextDescription}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                {isSignup ? (
                  <motion.span
                    key="signup"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 block"
                  >
                    {signupDescription}
                  </motion.span>
                ) : (
                  <motion.span
                    key="login"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 block"
                  >
                    {loginDescription}
                  </motion.span>
                )}
              </AnimatePresence>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-8 py-4">
              {/* OAuth */}
              <div className={`${!isSignup || isMobile ? "flex-row" : ""} flex flex-col gap-4`}>
                {/*Apple (we need paid dev account for this)*/}
                {/*<Button*/}
                {/*  className={`${!isSignup || isMobile ? "w-full p-4" : ""} flex-1`}*/}
                {/*  variant="outline"*/}
                {/*  size={isMobile || !isSignup ? "xl" : "default"}*/}
                {/*  type="button"*/}
                {/*  onClick={() => toast(appleToast)}*/}
                {/*>*/}
                {/*  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">*/}
                {/*    <path*/}
                {/*      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"*/}
                {/*      fill="currentColor"*/}
                {/*    />*/}
                {/*  </svg>*/}
                {/*  {appleLabel}*/}
                {/*</Button>*/}
                {/*Google*/}
                <Button
                  className={`${!isSignup || isMobile ? "w-full p-4" : ""} flex-1`}
                  variant="outline"
                  size={isMobile || !isSignup ? "xl" : "default"}
                  type="button"
                  onClick={() => onSignInSocial('google')}
                >
                 <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"/><path fill="#e33629" d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21"/><path fill="#f8bd00" d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9"/><path fill="#587dbd" d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68"/><path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4"/></svg>
                  {googleLabel}
                </Button>
                {/*Spotify*/}
                <Button
                    className={`${!isSignup || isMobile ? "w-full p-4" : ""} flex-1`}
                    variant="outline"
                    size={isMobile || !isSignup ? "xl" : "default"}
                    type="button"
                    onClick={() => onSignInSocial('spotify')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                      fill="#1DB954"
                    />
                  </svg>
                  {spotifyLabel}
                </Button>
              </div>
              {/* Divider */}
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              {/* Email form */}
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    ref={isMobile ? undefined : emailRef}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      className="ml-auto text-sm  underline-offset-4 hover:underline hover:text-muted-foreground cursor-pointer"
                      hidden={isSignup}
                      onClick={() => forgotPassword()}
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full mt-2">
                  {primaryButtonLabel}
                </Button>
              </div>
              <div className="text-center text-sm">
                {footerPrompt}{" "}
                <button
                  type="button"
                  onClick={() => setMode(footerMode)}
                  className="underline hover:text-muted-foreground underline-offset-4"
                >
                  {footerAction}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthOverlay;
