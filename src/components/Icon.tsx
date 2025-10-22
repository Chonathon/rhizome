import * as React from "react"

// Central registry for supplemental, non-lucide icons.
// Add new icons as entries in the `icons` map and they become
// available via the `name` prop on <AppIcon />.

export type IconComponent = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
>

// Example custom icon: two horizontal lines.
// Uses currentColor so it inherits text color, and supports size/strokeWidth.
export const TwoLines = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ width = 24, height = 24, strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 8.5H21M3 15.5H16.3375" />
    </svg>
  )
)
TwoLines.displayName = "TwoLines"


// aliases for named exports
export const TwoLinesIcon = TwoLines


export const icons = {
  // Variants
  twoLines: TwoLines,
} satisfies Record<string, IconComponent>

export type IconName = keyof typeof icons

export interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName
  size?: number | string
}

// Generic icon wrapper that renders any icon
export const AppIcon = React.forwardRef<SVGSVGElement, AppIconProps>(
  ({ name, size = 24, width, height, ...props }, ref) => {
    const Comp = icons[name]
    return <Comp ref={ref} width={width ?? size} height={height ?? size} {...props} />
  }
)
AppIcon.displayName = "AppIcon"

