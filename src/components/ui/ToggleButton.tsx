import { ReactNode } from "react";
import { Button } from "./button";

/**
 * ToggleButton - An accessible toggle button component using aria-pressed pattern
 *
 * Semantics: This is a TOGGLE BUTTON, not a switch or checkbox.
 * - Use for actions with binary states: Connect/Connected, Add/Added, Follow/Following
 * - Do NOT use for settings/preferences (use a Switch component instead)
 *
 * Accessibility:
 * - Uses aria-pressed to indicate toggle state
 * - Supports aria-label for context (e.g., "Connect to Last.FM")
 * - Supports aria-describedby to link to descriptive text
 * - Icons are decorative (aria-hidden) - state is conveyed through text and aria-pressed
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */
interface ToggleButtonProps {
  isActive: boolean;
  onToggle: () => void;
  activeLabel: string;
  inactiveLabel: string;
  activeIcon?: ReactNode;
  inactiveIcon?: ReactNode;
  requiresAuth?: boolean;
  loggedIn?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  className?: string;
  disabled?: boolean;
  /** Accessible label for screen readers. If not provided, uses the visible label */
  ariaLabel?: string;
  /** ID of element that describes this button for additional context */
  ariaDescribedBy?: string;
}

export function ToggleButton({
  isActive,
  onToggle,
  activeLabel,
  inactiveLabel,
  activeIcon,
  inactiveIcon,
  requiresAuth = false,
  loggedIn = true,
  variant,
  size = "lg",
  className,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
}: ToggleButtonProps) {
  const handleClick = () => {
    if (requiresAuth && !loggedIn) {
      window.dispatchEvent(new Event('auth:open'));
      return;
    }
    onToggle();
  };

  // Determine variant based on active state if not explicitly provided
  const buttonVariant = variant || (isActive ? "default" : "secondary");

  // Use provided aria-label or fall back to visible label
  const accessibleLabel = ariaLabel || (isActive ? activeLabel : inactiveLabel);

  return (
    <Button
      variant={buttonVariant}
      className={className}
      size={size}
      onClick={handleClick}
      aria-pressed={isActive}
      aria-label={accessibleLabel}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
    >
      {(activeIcon || inactiveIcon) && (
        <span className={`relative inline-flex items-center justify-center shrink-0 ${
          size === "sm" ? "size-3.5" : size === "lg" ? "size-4" : size === "xl" ? "size-5" : "size-4"
        }`}>
          {activeIcon && (
            <span
              aria-hidden="true"
              className={`absolute transition-all duration-200 ease-in-out pointer-events-none ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              {activeIcon}
            </span>
          )}
          {inactiveIcon && (
            <span
              aria-hidden="true"
              className={`absolute transition-all duration-200 ease-in-out pointer-events-none ${
                isActive ? "opacity-0" : "opacity-100"
              }`}
            >
              {inactiveIcon}
            </span>
          )}
        </span>
      )}
      <span>{isActive ? activeLabel : inactiveLabel}</span>
    </Button>
  );
}
