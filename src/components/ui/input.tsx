import * as React from "react"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, disabled, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null)
    const [hasFile, setHasFile] = React.useState(false)

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    }

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (type === "file") {
        setHasFile(!!e.currentTarget.files?.length)
      }
      onChange?.(e)
    }

    const clearFile = () => {
      const input = innerRef.current
      if (!input) return
      input.value = ""
      setHasFile(false)
      input.dispatchEvent(new Event("change", { bubbles: true }))
    }

    const baseClasses = cn(
      "file:text-foreground flex placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 dark:hover:bg-input/50 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:items-center file:h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm items-center",
      type === "file" ? "py-0 self-start leading-[2.5rem] pr-10" : "py-1",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      className
    )

    if (type === "file") {
      return (
        <div className="relative w-full">
          <input
            ref={setRefs}
            type={type}
            data-slot="input"
            className={baseClasses}
            onChange={handleChange}
            disabled={disabled}
            {...props}
          />
          {hasFile && !disabled ? (
            <Button
              type="button"
              variant={"ghost"}
              aria-label="Clear file"
              onClick={clearFile}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 "
              )}
            >
              ×
            </Button>
          ) : null}
        </div>
      )
    }

    return (
      <input
        ref={setRefs}
        type={type}
        data-slot="input"
        className={baseClasses}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
    )
  }
)

export { Input }
