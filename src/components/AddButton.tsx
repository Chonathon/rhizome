import { useState } from "react";
import { toast } from "sonner";
import { CheckSquare, PlusSquare } from "lucide-react";
import { ToggleButton } from "./ui/ToggleButton";

interface AddButtonProps {
  isInCollection?: boolean;
  loggedIn?: boolean;
  onToggle?: () => void;
  isDesktop?: boolean;
  className?: string;
}

export function AddButton({ onToggle, isDesktop, className, loggedIn=true }: AddButtonProps) {
  // Local state. Replace with prop
  const [isInCollection, setIsInCollection] = useState(false);

  const handleToggle = () => {
    if (isInCollection) {
      toast.info("Removed from your collection");
      setIsInCollection(false);
    } else {
      toast.success("Added to your collection");
      setIsInCollection(true);
    }
  };

  return (
    <ToggleButton
      isActive={isInCollection}
      onToggle={handleToggle}
      activeLabel="Added"
      inactiveLabel="Add"
      activeIcon={<CheckSquare />}
      inactiveIcon={<PlusSquare />}
      requiresAuth={true}
      loggedIn={loggedIn}
      className={className || (isDesktop ? "px-4 self-start" : "px-4 flex-1")}
      size={isDesktop ? "lg" : "xl"}
    />
  );
}
