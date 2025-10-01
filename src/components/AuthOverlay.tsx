import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function AuthOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("auth:open", handleOpen as EventListener);
    return () => {
      window.removeEventListener("auth:open", handleOpen as EventListener);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription>
            Sign in to view your collection and save artists.
          </DialogDescription>
        </DialogHeader>
        {/* TODO: Build out your email/OAuth UI here */}
      </DialogContent>
    </Dialog>
  );
}

export default AuthOverlay;
