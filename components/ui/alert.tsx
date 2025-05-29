import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variantClasses = {
            default: "bg-white text-gray-900 border-gray-200",
            destructive: "border-red-200 text-red-800 bg-red-50 [&>svg]:text-red-600",
        }

        return (
            <div
                ref={ref}
                role="alert"
                className={cn(
                    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-600",
                    variantClasses[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }

