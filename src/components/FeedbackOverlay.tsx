import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface FeedbackOverlayProps {
}



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
                    <DialogTitle className="sm:text-3xl text-2xl text-center">Feedback & Support</DialogTitle>
                    <DialogDescription className="text-md text-center">
                        We'd love to hear your thoughts! Please reach out with any feedback, questions, or issues you encounter while using Rhizome.
                    </DialogDescription>
                </DialogHeader>
                
                    </DialogContent>
            </Dialog>
        );
    }

export default FeedbackOverlay;