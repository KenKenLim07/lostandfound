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
          "relative border-2 rounded-md px-3 py-3 cursor-text transition-colors floating-label-input",
          "border-input",
          error && "border-destructive",
          isFocused && "border-blue-500", // Custom focus state with your preferred color
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
            "absolute left-3 px-1 text-sm transition-all duration-200 pointer-events-none",
            icon && "left-10",
            shouldFloat
              ? "floating text-xs text-foreground bg-background" // Using custom CSS class for precise positioning
              : "top-3 text-muted-foreground"
          )}
        >
          {label}
        </label>
        <input
          type={type}
          id={id}
          className={cn(
            "w-full bg-transparent focus:outline-none text-base md:text-sm text-foreground placeholder-transparent",
            icon && "pl-7",
            "mobile-menu:h-9 mobile-menu:text-sm"
          )}
          style={{ 
            height: '36px', // Reduced from 48px to 36px for more compact size
            lineHeight: '36px', // Match the height for proper text centering
            padding: '0',
            margin: '0',
            position: 'absolute',
            top: '50%', // Perfect centering using transform
            left: '16px', // Increased left margin for better centering
            right: '16px', // Increased right margin for better centering
            width: 'calc(100% - 32px)', // Explicit width calculation to prevent overflow
            transform: 'translateY(-50%)' // Perfect vertical centering
          }}
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