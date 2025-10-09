import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./button";
import { CheckSquare, PlusSquare } from "lucide-react";

interface AddButtonProps {
  // isInCollection?: boolean;
  onToggle: () => void;
  isDesktop?: boolean;
  className?: string;
}


export function AddButton({ onToggle, isDesktop, className }: AddButtonProps) {
  const [isInCollection, setIsInCollection] = useState(false);
  const handleClick = () => {
    if (isInCollection) {
      toast.error("Removed from your collection");
      setIsInCollection(false);
    } else {
      toast.success("Added to your collection");
      setIsInCollection(true);
    }
  };
  
  return (
    <Button
      variant={isInCollection ? "default" : "secondary"}
      className={className || (isDesktop ? "self-start" : "flex-1")}
      size={isDesktop ? "lg" : "xl"}
      onClick={handleClick}
    >
      {isInCollection ? <CheckSquare /> : <PlusSquare />}
      {isInCollection ? "Added" : "Add"}
    </Button>
  );
}
