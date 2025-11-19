import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: React.ReactNode;
}

export function ImageLightbox({ src, alt, open, onOpenChange, link }: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-transparent w-fit max-w-[95vw] py-6 shadow-none px-0 max-h-[95vh] border-0 ">
        {/* <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-6 w-6 text-white" />
        </button> */}
        <div className="flex items-center justify-center w-full h-full p-4">
          <img
            src={src}
            alt={alt}
            className="rounded-xl max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
          <div className="h-full w-full flex justify-end items-end bg-white ">{link}</div>
      </DialogContent>
    </Dialog>
  );
}
