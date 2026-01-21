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
  onValidatePassword: (email: string, accessCode: string) => Promise<boolean>;
}

function AlphaAccessDialog({ open, onValidPassword, onValidatePassword }: AlphaAccessDialogProps) {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    if (!accessCode.trim()) {
      const msg = "Please enter the alpha access password";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsValidating(true);
    try {
      const isValid = await onValidatePassword(email, accessCode);
      if (isValid) {
        toast.success("You're in! Welcome to Rhizome Alpha");
        onValidPassword();
      } else {
        const msg = "Hmm, that didn’t match. Try again?";
        setErrorMessage(msg);
        toast.error(msg);
        setAccessCode("");
        passwordRef.current?.focus();
      }
    } catch (err) {
      const msg = "That didn't seem to work. Try again?";
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
              Rhizome is alpha testing!
            </DialogTitle>
            <DialogDescription className="text-md text-center">
              We're keeping access limited while we work out some kinks and squash some bugs. Enter your password if you've been invited!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-6 py-4">
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="alpha-email">Email Address</FieldLabel>
                  <FieldContent>
                    <Input
                      id="alpha-email"
                      type="email"
                      placeholder="Enter your email address"
                      ref={emailRef}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isValidating}
                      required
                    />
                    <FieldDescription>
                    This must match the email address the access code was sent to
                    </FieldDescription>
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="alpha-password">Alpha Access Code</FieldLabel>
                  <FieldContent>
                    <Input
                        id="alpha-password"
                        placeholder="Enter your alpha password"
                        ref={passwordRef}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        disabled={isValidating}
                        required
                    />
                    <FieldDescription>
                      You’ll get a unique access code by email when invited
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
                  href="https://seanathon.notion.site/2677b160b42a8088bf0dc34328c1cb30?pvs=105"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Sign up for the alpha
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


