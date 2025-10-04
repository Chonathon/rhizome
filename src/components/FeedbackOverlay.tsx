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
                    <DialogTitle className="sm:text-xl text-2xl">Feedback & Support</DialogTitle>
                    <DialogDescription className="">
                        We'd love to hear your thoughts! Please reach out with any feedback, questions, or issues you encounter while using Rhizome.
                    </DialogDescription>
                </DialogHeader>
                <FieldSet>
              <Field>
                <FieldLabel htmlFor="feedback-comments">
                  Comments
                </FieldLabel>
                <Textarea
                  id="feedback-comments"
                  placeholder="Add any additional comments"
                  className="resize-none"
                />
              </Field>
                  <Field>
                    <FieldLabel className="sr-only" htmlFor="attachment">
                      Attach an image (optional)
                    </FieldLabel>
                    <Input id="attachment" type="file" />
                              </Field>
                  {/* <Button type="submit">Submit</Button> */}
          </FieldSet>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={() => toast('Thanks for the tip, we\'re on it!')} type="submit">Submit
                    </Button>
                </DialogClose>
            </DialogFooter>
                    </DialogContent>
            </Dialog>
        );
    }

export default FeedbackOverlay;