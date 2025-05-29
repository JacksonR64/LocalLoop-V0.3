import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variantClasses = {
            default: "bg-blue-600 text-white hover:bg-blue-700",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
            destructive: "bg-red-600 text-white hover:bg-red-700",
            outline: "text-gray-900 border border-gray-300 bg-white hover:bg-gray-50",
        }

        return (
            <div
                className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    variantClasses[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge } 