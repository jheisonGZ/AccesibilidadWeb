import { type ButtonHTMLAttributes, forwardRef } from "react"

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className = "", selected = false, children, ...props }, ref) => {
    const baseStyles =
      "px-4 py-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    const selectedStyles = selected
      ? "bg-primary text-primary-foreground shadow-md"
      : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"

    return (
      <button ref={ref} className={`${baseStyles} ${selectedStyles} ${className}`} {...props}>
        {children}
      </button>
    )
  },
)

Chip.displayName = "Chip"
