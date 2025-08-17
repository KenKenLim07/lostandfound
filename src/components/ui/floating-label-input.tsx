"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
  icon?: React.ReactNode
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, error, icon, type, id, value = "", ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    // Use interval to check focus state instead of relying on blur events
    React.useEffect(() => {
      const checkFocus = () => {
        const isCurrentlyFocused = document.activeElement === inputRef.current
        if (isCurrentlyFocused !== isFocused) {
          setIsFocused(isCurrentlyFocused)
        }
      }

      const interval = setInterval(checkFocus, 100)
      return () => clearInterval(interval)
    }, [isFocused])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Let the interval handle the focus state
      props.onBlur?.(e)
    }

    const hasValue = value !== undefined && value !== null && value.toString().trim().length > 0
    const shouldFloat = isFocused || hasValue

    return (
      <div 
        className={cn(
          "relative border-2 rounded-md cursor-text transition-colors floating-label-input",
          "border-input",
          error && "border-destructive",
          isFocused && "border-blue-500", // Custom focus state with your preferred color
          // Responsive padding: more padding on desktop, less on mobile
          "py-3 md:py-4",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground">
            {icon}
          </div>
        )}
        <label
          htmlFor={id}
          className={cn(
            "absolute left-3 px-1 text-sm pointer-events-none",
            icon && "left-10",
            shouldFloat
              ? "text-xs text-foreground bg-background floating" // Add floating class for mobile menu CSS
              : "text-muted-foreground",
            // Responsive positioning using Tailwind classes
            shouldFloat 
              ? "-top-2" 
              : "top-2 md:top-3" // top-2 (8px) on mobile, top-3 (12px) on desktop
          )}
          style={{
            transition: 'top 0.2s ease-in-out, font-size 0.2s ease-in-out, color 0.2s ease-in-out'
          }}
        >
          {label}
        </label>
        <input
          type={type}
          id={id}
          className={cn(
            "bg-transparent focus:outline-none text-base md:text-sm text-foreground placeholder-transparent",
            icon && "pl-7",
            "mobile-menu:h-9 mobile-menu:text-sm",
            // Ensure proper height and centering on all screen sizes
            "h-10 md:h-11", // h-10 (40px) on mobile, h-11 (44px) on desktop
            "leading-none", // Remove line-height to prevent vertical centering issues
            // Center the input vertically within the container
            "absolute top-1/2 transform -translate-y-1/2",
            // Create visual margin by making input narrower than container
            "left-3 right-3", // 12px margin on left and right
            // Adjust positioning for icon
            icon ? "pl-7 pr-3" : "px-0"
          )}
          placeholder={label}
          ref={(node) => {
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
            }
            inputRef.current = node
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          autoFocus={false}
          {...props}
        />
      </div>
    )
  }
)

FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput } 