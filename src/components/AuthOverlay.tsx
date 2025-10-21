import { useEffect, useState, useRef, type FormEvent } from "react";
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

type AuthMode = "signup" | "login";

function AuthOverlay() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const isMobile = useMediaQuery("(max-width: 640px)");

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
  const primaryButtonLabel = isSignup ? "Continue" : "Log in";
  const primaryToast = isSignup
    ? "Oof, not even email sign-up is implemented 😬"
    : "Yikes, we haven't built log in yet either 😬";
  const appleToast = isSignup ? "Apple sign-up not yet implemented 🙃" : "Apple log in not yet implemented 🙃";
  const googleToast = isSignup ? "Google sign-up not yet implemented 🙃" : "Google log in not yet implemented 🙃";
  const footerPrompt = isSignup ? "Already have an account?" : "Need an account?";
  const footerAction = isSignup ? "Log in" : "Sign up";
  const footerMode: AuthMode = isSignup ? "login" : "signup";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setMode("signup");
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast(primaryToast);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          emailRef.current?.focus();
        }}
      >
        <DialogHeader>
          <div>
            <RhizomeLogo className="mx-auto mb-4 h-11 sm:h-14 w-auto" />
          </div>
          <DialogTitle className="sm:text-3xl text-2xl text-center">
            {isSignup ? "Create a free account to start your collection" : "Log in to continue your collection"}
          </DialogTitle>
          <DialogDescription className="text-md text-center">
            {isSignup ? (
              <>
                Add artists to your collection from Rhizome, or import your entire library from{" "}
                <strong>Last.FM</strong>, <strong>Deezer</strong>, <strong>Spotify</strong>, and more... soon!
              </>
            ) : (
              <>Welcome back. We've been keeping all your stuff safe while you were away</>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-8 py-4">
            {/* OAuth */}
            <div className={`${!isSignup || isMobile ? "flex-row" : ""} flex flex-col gap-4`}>
              <Button
                className={`${!isSignup || isMobile ? "w-full p-4" : ""} flex-1`}
                variant="outline"
                size={isMobile || !isSignup ? "xl" : "default"}
                type="button"
                onClick={() => toast(appleToast)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                {appleLabel}
              </Button>
              <Button
                className={`${!isSignup || isMobile ? "w-full p-4" : ""} flex-1`}
                variant="outline"
                size={isMobile || !isSignup ? "xl" : "default"}
                type="button"
                onClick={() => toast(googleToast)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                {googleLabel}
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
                  placeholder="m@example.com"
                  ref={emailRef}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
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
                className="underline underline-offset-4"
              >
                {footerAction}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AuthOverlay;
