import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

interface SplitButtonContextValue {
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  disabled?: boolean
}

const SplitButtonContext = React.createContext<SplitButtonContextValue>({})

interface SplitButtonProps extends React.ComponentProps<"div">, VariantProps<typeof buttonVariants> {
  /** Whether the split button is disabled */
  disabled?: boolean
}

function SplitButton({
  className,
  variant = "default",
  size = "default",
  disabled = false,
  children,
  ...props
}: SplitButtonProps) {
  const contextValue = React.useMemo(
    () => ({ variant, size, disabled }),
    [variant, size, disabled]
  )

  return (
    <SplitButtonContext.Provider value={contextValue}>
      <ButtonGroup className={cn("self-start space-x-0.5 rounded-full overflow-clip", className)} {...props}>
        {children}
      </ButtonGroup>
    </SplitButtonContext.Provider>
  )
}

const SplitButtonAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, children, disabled: disabledProp, ...props }, ref) => {
    const { variant, size, disabled: contextDisabled } = React.useContext(SplitButtonContext)
    const disabled = disabledProp ?? contextDisabled

    return (
      <button
        ref={ref}
        data-slot="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size }),
          "!pr-3.5 !rounded-[4px]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SplitButtonAction.displayName = "SplitButtonAction"

interface SplitButtonTriggerProps extends React.ComponentProps<"button"> {
  /** Accessible label for the trigger button */
  "aria-label"?: string
}

const SplitButtonTrigger = React.forwardRef<HTMLButtonElement, SplitButtonTriggerProps>(
  (
    {
      className,
      children,
      "aria-label": ariaLabel = "More options",
      disabled: disabledProp,
      ...props
    },
    ref
  ) => {
    const { variant, size, disabled: contextDisabled } = React.useContext(SplitButtonContext)
    const disabled = disabledProp ?? contextDisabled

    return (
      <button
        ref={ref}
        data-slot="button"
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          buttonVariants({ variant, size }),
          "h-auto !pl-2 !pr-3 !rounded-[4px]",
          className
        )}
        {...props}
      >
        {children ?? <ChevronDown className="size-4" />}
      </button>
    )
  }
)
SplitButtonTrigger.displayName = "SplitButtonTrigger"

export { SplitButton, SplitButtonAction, SplitButtonTrigger }
