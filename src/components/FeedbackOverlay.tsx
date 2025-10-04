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
import { toast } from "sonner";

function FeedbackOverlay() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("feedback:open", handleOpen as EventListener);
        return () => {
          window.removeEventListener("feedback:open", handleOpen as EventListener);
        };
      }, []);



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-card max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-lg">
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
                />
              </Field>
                  <Field>
                    <FieldLabel className="sr-only" htmlFor="attachment">
                      Attach an image (optional)
                    </FieldLabel>
                    <Input id="attachment" type="file" />
                              </Field>
          </FieldSet>
            <DialogFooter>
                <DialogClose className="flex-1" asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose> 
                    {/* feedback:success → toast.success + setOpen(false) + setSubmitting(false) */}
                    <Button className="flex-1" onClick={() => toast.success('Got it. Thanks for the tip!')} 
                    type="submit" disabled={true}>Submit
                    </Button>
            </DialogFooter>
                    </DialogContent>
            </Dialog>
        );
    }

export default FeedbackOverlay;