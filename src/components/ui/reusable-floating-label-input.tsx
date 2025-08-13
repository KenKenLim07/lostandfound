"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ReusableFloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
  icon?: React.ReactNode
  // Customization options
  labelClassName?: string
  containerClassName?: string
  inputClassName?: string
  // Animation options
  animationDuration?: number
  // Focus detection method
  useIntervalFocusDetection?: boolean
  focusCheckInterval?: number
}

const ReusableFloatingLabelInput = React.forwardRef<HTMLInputElement, ReusableFloatingLabelInputProps>(
  ({ 
    className, 
    label, 
    error, 
    icon, 
    type, 
    id, 
    value = "", 
    labelClassName,
    containerClassName,
    inputClassName,
    animationDuration = 200,
    useIntervalFocusDetection = true,
    focusCheckInterval = 100,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    // Robust focus detection using interval (recommended)
    React.useEffect(() => {
      if (!useIntervalFocusDetection) return

      const checkFocus = () => {
        const isCurrentlyFocused = document.activeElement === inputRef.current
        if (isCurrentlyFocused !== isFocused) {
          setIsFocused(isCurrentlyFocused)
        }
      }

      const interval = setInterval(checkFocus, focusCheckInterval)
      return () => clearInterval(interval)
    }, [isFocused, useIntervalFocusDetection, focusCheckInterval])

    // Fallback focus/blur handlers (less reliable but lighter)
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!useIntervalFocusDetection) {
        setIsFocused(true)
      }
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!useIntervalFocusDetection) {
        // Add a small delay to handle focus switching between inputs
        setTimeout(() => {
          if (document.activeElement !== inputRef.current) {
            setIsFocused(false)
          }
        }, 50)
      }
      props.onBlur?.(e)
    }

    const hasValue = value !== undefined && value !== null && value.toString().trim().length > 0
    const shouldFloat = isFocused || hasValue

    return (
      <div 
        className={cn(
          "relative border rounded-md px-3 py-3 focus-within:border-ring cursor-text transition-colors",
          "border-input focus-within:border-ring",
          error && "border-destructive focus-within:border-destructive",
          containerClassName,
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
            "absolute left-3 px-1 text-sm transition-all pointer-events-none",
            icon && "left-10",
            shouldFloat
              ? "-top-2 text-xs text-foreground bg-background"
              : "top-3 text-muted-foreground",
            labelClassName
          )}
          style={{ transitionDuration: `${animationDuration}ms` }}
        >
          {label}
        </label>
        <input
          type={type}
          id={id}
          className={cn(
            // Use 16px on mobile to prevent iOS zoom, fall back to sm on md+
            "w-full bg-transparent focus:outline-none text-base md:text-sm text-foreground placeholder-transparent",
            icon && "pl-7",
            inputClassName
          )}
          placeholder={label}
          ref={(node) => {
            // Handle both refs
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

ReusableFloatingLabelInput.displayName = "ReusableFloatingLabelInput"

export { ReusableFloatingLabelInput } 