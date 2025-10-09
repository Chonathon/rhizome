import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { CheckSquare, PlusSquare } from "lucide-react";

interface AddButtonProps {
  isInCollection?: boolean;
  loggedIn?: boolean;
  onToggle?: () => void;
  isDesktop?: boolean;
  className?: string;
}


export function AddButton({ isInCollection, onToggle, isDesktop, className, loggedIn=true }: AddButtonProps) {
  // Local state. Replace with prop
  // const [isInCollection, setIsInCollection] = useState(false);
  // const handleToggle = () => {
  //   if (!loggedIn) {
  //     window.dispatchEvent(new Event('auth:open'));
  //     return;
  //   }
  //   if (isInCollection) {
  //     toast.info("Removed from your collection");
  //     setIsInCollection(false);
  //   } else {
  //     toast.success("Added to your collection");
  //     setIsInCollection(true);
  //   }
  // };
  
  return (
    <Button
      variant={isInCollection ? "default" : "secondary"}
      className={className || (isDesktop ? "px-4 self-start" : "px-4  flex-1")}
      size={isDesktop ? "lg" : "xl"}
      onClick={onToggle}
      aria-pressed={isInCollection}
    >
      <span className={`relative inline-flex items-center justify-center shrink-0 ${isDesktop ? "size-4" : "size-5"}`}>
        <CheckSquare
          aria-hidden="true"
          className={`absolute transition-all duration-200 ease-in-out pointer-events-none ${isInCollection ? " opacity-100" : " opacity-0"}`}
        />
        <PlusSquare
          aria-hidden="true"
          className={`absolute transition-all duration-200 ease-in-out pointer-events-none ${isInCollection ? " opacity-0" : " opacity-100"}`}
        />
      </span>
      <span>{isInCollection ? "Added" : "Add"}</span>
    </Button>
  );
}
