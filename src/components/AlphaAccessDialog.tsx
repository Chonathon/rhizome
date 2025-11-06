import { useState, useRef, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RhizomeLogo from "./RhizomeLogo";
import { toast } from "sonner";
import {
  FieldSet,
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

interface AlphaAccessDialogProps {
  open: boolean;
  onValidPassword: () => void;
  onValidatePassword: (password: string) => Promise<boolean>;
}

function AlphaAccessDialog({ open, onValidPassword, onValidatePassword }: AlphaAccessDialogProps) {
  const [password, setPassword] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    if (!password.trim()) {
      const msg = "Please enter the alpha access password";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsValidating(true);
    try {
      const isValid = await onValidatePassword(password);
      if (isValid) {
        toast.success("Access granted! Welcome to Rhizome Alpha");
        onValidPassword();
      } else {
        const msg = "Invalid password. Please check with the Rhizome team for access.";
        setErrorMessage(msg);
        toast.error(msg);
        setPassword("");
        passwordRef.current?.focus();
      }
    } catch (err) {
      const msg = "Error validating password. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      console.error("Alpha password validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-card max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          passwordRef.current?.focus();
        }}
        showCloseButton={false}
      >
        <div>
          <DialogHeader>
            <div>
              <RhizomeLogo className="mx-auto mb-4 h-11 sm:h-14 w-auto" />
            </div>
            <DialogTitle className="sm:text-3xl text-2xl text-center">
              Alpha Access Required
            </DialogTitle>
            <DialogDescription className="text-md text-center">
              Rhizome is currently in alpha testing. Please enter your unique alpha password to continue.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-6 py-4">
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="alpha-password">Alpha Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="alpha-password"
                      type="password"
                      placeholder="Enter your alpha password"
                      ref={passwordRef}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isValidating}
                      required
                    />
                    <FieldDescription>
                      Use one of the mock passwords configured for this build.
                    </FieldDescription>
                    <FieldError>{errorMessage}</FieldError>
                  </FieldContent>
                </Field>
              </FieldSet>
              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={isValidating}
              >
                {isValidating ? "Validating..." : "Continue"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have access?{" "}
                <a
                  href="mailto:contact@rhizome.app"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Contact us
                </a>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AlphaAccessDialog;


