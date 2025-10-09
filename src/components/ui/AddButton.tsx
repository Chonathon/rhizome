import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./button";
import { CheckSquare, PlusSquare } from "lucide-react";

interface AddButtonProps {
  isInCollection?: boolean;
  loggedIn?: boolean;
  onToggle: () => void;
  isDesktop?: boolean;
  className?: string;
}


export function AddButton({ onToggle, isDesktop, className, loggedIn=false }: AddButtonProps) {
  // Local state. Replace with prop
  const [isInCollection, setIsInCollection] = useState(false);
  const handleClick = () => {
    if (!loggedIn) {
      window.dispatchEvent(new Event('auth:open'));
      return;
    }
    if (isInCollection) {
      toast.error("Removed from your collection");
      setIsInCollection(false);
    } else {
      toast.success("Added to your collection");
      setIsInCollection(true);
    }

    onToggle();
  };
  
  return (
    <Button
      variant={isInCollection ? "default" : "secondary"}
      className={className || (isDesktop ? "px-4 self-start" : "px-4  flex-1")}
      size={isDesktop ? "lg" : "xl"}
      onClick={handleClick}
      aria-pressed={isInCollection}
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <CheckSquare
          aria-hidden="true"
          className={`absolute transition-all duration-200 ease-in-out ${isInCollection ? " opacity-100" : " opacity-0"}`}
        />
        <PlusSquare
          aria-hidden="true"
          className={`absolute transition-all duration-200 ease-in-out ${isInCollection ? " opacity-0" : " opacity-100"}`}
        />
      </span>
      <span>{isInCollection ? "Added" : "Add"}</span>
    </Button>
  );
}
