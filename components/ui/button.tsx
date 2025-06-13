import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset-background)] disabled:pointer-events-none disabled:opacity-50"

        const variantClasses = {
            default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
            destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive-hover)]",
            outline: "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
            secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80",
            ghost: "text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
            link: "text-[var(--primary)] underline-offset-4 hover:underline",
        }

        const sizeClasses = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        // For actual button elements
        if (!asChild) {
            return (
                <button
                    className={cn(
                        baseClasses,
                        variantClasses[variant],
                        sizeClasses[size],
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            )
        }

        // For asChild prop (typically with links)
        return (
            <span
                className={cn(
                    baseClasses,
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button } 