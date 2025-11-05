import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {Feedback} from "@/types";
import {FEEDBACK_TEXT_LIMIT, UNREGISTERED_USER_ID} from "@/constants";

interface FeedbackOverlayProps {
    userID?: string;
    userEmail?: string;
    onSubmit: (feedback: Feedback) => Promise<boolean>;
}

function FeedbackOverlay({ userID, userEmail, onSubmit }: FeedbackOverlayProps) {
    const [open, setOpen] = useState(false);
    const [includeEmail, setIncludeEmail] = useState(false);
    const [email, setEmail] = useState(userEmail);
    const [text, setText] = useState('');
    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("feedback:open", handleOpen as EventListener);
        return () => {
          window.removeEventListener("feedback:open", handleOpen as EventListener);
        };
      }, []);

    const submit = async () => {
        const success = await onSubmit({
            email: includeEmail ? email : undefined,
            text,
            userID: userID ? userID : UNREGISTERED_USER_ID,
            resolved: false,
        });
        if (success) {
            toast.success('Thank you for your feedback!');
            setEmail('');
            setText('');
            setIncludeEmail(false);
            setOpen(false);
        } else {
            toast.error('Error: could not submit feedback.');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              className="bg-card max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-lg"
            >
                <DialogHeader>
                    <DialogTitle>Feedback & Requests</DialogTitle>
                    <DialogDescription>
                        We're just getting started. Let us know how we can improve Rhizome!
                    </DialogDescription>
                </DialogHeader>
                <FieldSet>
              <Field>
                <FieldLabel className="sr-only" htmlFor="feedback-comments">
                  Comments
                </FieldLabel>
                <Textarea
                  id="feedback-comments"
                  placeholder=""
                  className="resize-none min-h-[160px] "
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </Field>
                  {/* <Field>
                    <FieldLabel className="sr-only" htmlFor="attachment">
                      Attach an image (optional)
                    </FieldLabel>
                    <Input id="attachment" type="file" />
                              </Field> */}
                  <Field className="rounded-xl border border-border/60 bg-transparent px-3 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Want us to get back to you?</p>
                        <FieldDescription className="mt-1">
                          {includeEmail ? "Sending with email (optional)" : "Sending anonymously"}
                        </FieldDescription>
                      </div>
                      <Switch
                        id="include-email-toggle"
                        checked={includeEmail}
                        onCheckedChange={(checked) => {
                          setIncludeEmail(checked);
                        }}
                        aria-label={includeEmail ? "Sending with email" : "Sending anonymously"}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {includeEmail && (
                        <motion.div
                          key="feedback-email-field"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <Field className="mt-3">
                            <FieldLabel className="sr-only" htmlFor="feedback-email">Email (optional)</FieldLabel>
                            <Input
                              id="feedback-email"
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                            />
                          </Field>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Field>
          </FieldSet>
            <DialogFooter>
                <DialogClose className="flex-1" asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose> 
                    {/* feedback:success → toast.success + setOpen(false) + setSubmitting(false) */}
                    <Button className="flex-1" onClick={() => submit()}
                    type="submit" disabled={!text.length || text.length > FEEDBACK_TEXT_LIMIT}>Submit
                    </Button>
            </DialogFooter>
                    </DialogContent>
            </Dialog>
        );
    }

export default FeedbackOverlay;
