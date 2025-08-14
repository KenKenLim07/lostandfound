"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { forwardRef, useEffect, useState } from "react"

interface AnimatedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  delay?: number
  trigger?: boolean
}

export const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  ({ href, children, className, onClick, delay = 1000, trigger = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
      if (!trigger) {
        setIsVisible(false)
        return
      }

      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)

      return () => clearTimeout(timer)
    }, [delay, trigger])

    return (
      <div className="relative inline-block">
        <Link
          ref={ref}
          href={href}
          onClick={onClick}
          className={cn(
            "text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide px-2 pb-1 transition-all duration-700 ease-out",
            className
          )}
          {...props}
        >
          {children}
        </Link>
        <div
          className={cn(
            "absolute bottom-0 left-1/2 h-0.5 bg-black transform origin-right transition-transform duration-700 ease-out -translate-x-1/2",
            isVisible ? "scale-x-100" : "scale-x-0"
          )}
          style={{ width: '85%' }}
        />
      </div>
    )
  }
)

AnimatedLink.displayName = "AnimatedLink" 