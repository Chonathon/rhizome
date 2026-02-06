import { useState } from "react";
import { toast } from "sonner";
import { CheckSquare, PlusSquare } from "lucide-react";
import { BookOpen } from "./Icon"
import { ToggleButton } from "./ui/ToggleButton";

interface AddButtonProps {
  isInCollection: boolean;
  loggedIn?: boolean;
  onToggle: () => void;
  isDesktop?: boolean;
  className?: string;
}


export function AddButton({ isInCollection, onToggle, isDesktop, className, loggedIn=true }: AddButtonProps) {
  // Local state. Replace with prop
  
  return (
    <ToggleButton
      isActive={isInCollection}
      onToggle={onToggle}
      activeLabel="Added"
      inactiveLabel="Add to Collection"
      activeIcon={<BookOpen />}
      inactiveIcon={<PlusSquare />}
      className={className || (isDesktop ? "px-4 self-start" : "px-4 flex-1")}
      size={isDesktop ? "lg" : "xl"}
    />
  );
}
