"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FloatingLabelInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  label: string
  error?: boolean
  icon?: React.ReactNode
  value?: string
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, error, icon, type, id, value = "", ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Check if this input is currently focused by comparing with document.activeElement
    const checkFocus = React.useCallback(() => {
      const isCurrentlyFocused = document.activeElement === inputRef.current
      if (isCurrentlyFocused !== isFocused) {
        console.log(`Focus state changed for ${id}:`, isCurrentlyFocused)
        setIsFocused(isCurrentlyFocused)
      }
    }, [isFocused, id])

    // Check focus state periodically and on focus/blur events
    React.useEffect(() => {
      const interval = setInterval(checkFocus, 100)
      return () => clearInterval(interval)
    }, [checkFocus])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      console.log('Focus event triggered for:', id)
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      console.log('Blur event triggered for:', id)
      // Don't immediately set to false, let the interval check handle it
      props.onBlur?.(e)
    }

    // Check if we should show the floating label
    const hasValue = value && value.toString().trim().length > 0
    const shouldFloat = isFocused || hasValue

    console.log('FloatingLabelInput Debug:', { 
      id, 
      value, 
      hasValue, 
      isFocused, 
      shouldFloat 
    })

    return (
      <div 
        className={cn(
          "relative border rounded-md px-3 py-3 focus-within:border-ring cursor-text transition-colors",
          "border-input focus-within:border-ring",
          error && "border-destructive focus-within:border-destructive",
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
              ? "-top-2 text-xs text-foreground bg-background"
              : "top-3 text-muted-foreground"
          )}
        >
          {label}
        </label>
        <input
          type={type}
          id={id}
          className={cn(
            "w-full bg-transparent focus:outline-none text-sm text-foreground placeholder-transparent",
            icon && "pl-7"
          )}
          placeholder={label}
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
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