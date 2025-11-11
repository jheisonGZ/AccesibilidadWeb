import { type HTMLAttributes, forwardRef } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", glass = false, children, ...props }, ref) => {
    const baseStyles = "rounded-2xl p-6 shadow-lg"
    const glassStyles = glass ? "glass-card" : "bg-card text-card-foreground"

    return (
      <div ref={ref} className={`${baseStyles} ${glassStyles} ${className}`} {...props}>
        {children}
      </div>
    )
  },
)

Card.displayName = "Card"
