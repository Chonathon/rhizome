import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link?: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
} & (
  | { src: string; alt: string; children?: never }
  | { src?: undefined; alt?: undefined; children: React.ReactNode }
);

export function ImageLightbox({
  src,
  alt,
  open,
  onOpenChange,
  link,
  children,
  contentClassName,
  bodyClassName,
  showCloseButton = true
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-transparent w-full md:w-fit max-w-[95vw] py-6 shadow-none px-0 max-h-[95vh] border-0",
          contentClassName
        )}
        showCloseButton={showCloseButton}
      >
        {/* <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-6 w-6 text-white" />
        </button> */}
        {children ? (
          <div className={cn("w-full", bodyClassName)}>{children}</div>
        ) : (
          <div className={cn("flex items-center justify-center w-full h-full p-2 md:p-4", bodyClassName)}>
            <img
              src={src}
              alt={alt}
              className="rounded-xl max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {link && <div className="flexjustify-center">{link}</div>}
      </DialogContent>
    </Dialog>
  );
}
