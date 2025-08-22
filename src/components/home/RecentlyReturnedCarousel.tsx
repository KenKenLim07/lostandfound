"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"

type Item = {
  id: string
  title: string | null
  image_url: string | null
  returned_party: string | null
}

interface RecentlyReturnedCarouselProps {
  items: Item[]
}

export function RecentlyReturnedCarousel({ items }: RecentlyReturnedCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [animationPaused, setAnimationPaused] = useState(false)
  
  // Limit to 5 items as requested
  const displayItems = items.slice(0, 5)
  
  useEffect(() => {
    if (displayItems.length <= 3) return // Don't animate if not enough items
    
    const container = containerRef.current
    if (!container) return
    
    let animationId: number
    let startTime: number
    const duration = 20000 // 20 seconds for full cycle
    const itemWidth = 168 // 160px width + 8px gap
    
    const animate = (currentTime: number) => {
      if (animationPaused) {
        animationId = requestAnimationFrame(animate)
        return
      }
      
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = (elapsed % duration) / duration
      
      // Smooth easing function for Apple-style animation
      const easeInOut = (t: number) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      }
      
      const easedProgress = easeInOut(progress)
      const translateX = -easedProgress * (displayItems.length - 3) * itemWidth
      
      container.style.transform = `translateX(${translateX}px)`
      
      animationId = requestAnimationFrame(animate)
    }
    
    setIsAnimating(true)
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      setIsAnimating(false)
    }
  }, [displayItems.length, animationPaused])
  
  // Handle user scrolling
  const handleScroll = () => {
    if (!isUserScrolling) {
      setIsUserScrolling(true)
      setAnimationPaused(true)
    }
    
    // Reset the timer when user scrolls
    clearTimeout((window as any).scrollTimeout)
    ;(window as any).scrollTimeout = setTimeout(() => {
      setIsUserScrolling(false)
      setAnimationPaused(false)
    }, 3000) // Resume animation after 3 seconds of no scrolling
  }
  
  if (displayItems.length === 0) {
    return (
      <div className="pl-2 text-sm text-muted-foreground">No recent returns.</div>
    )
  }
  
  return (
    <div className="relative overflow-x-auto pl-2 pb-1 scrollbar-hide">
      <div 
        ref={containerRef}
        className={`flex gap-2 transition-transform duration-1000 ease-out ${
          isAnimating && !isUserScrolling ? '' : 'transform-none'
        }`}
        style={{ 
          width: `${displayItems.length * 168}px`, // 160px item + 8px gap
          transform: isAnimating && !isUserScrolling ? 'translateX(0)' : 'translateX(0)'
        }}
        onScroll={handleScroll}
        onTouchStart={() => setAnimationPaused(true)}
        onTouchEnd={() => {
          setTimeout(() => setAnimationPaused(false), 1000)
        }}
        onMouseEnter={() => setAnimationPaused(true)}
        onMouseLeave={() => setAnimationPaused(false)}
      >
        {displayItems.map((it) => (
          <Link 
            key={it.id} 
            href={`/items/${it.id}?from=home`} 
            className="w-40 shrink-0 rounded-xl border bg-white shadow-xs p-2 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 hover:scale-105"
          >
            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
              {it.image_url ? (
                <Image
                  src={it.image_url}
                  alt={it.title || "Returned item"}
                  width={160}
                  height={90}
                  className="h-full w-full object-cover"
                  sizes="160px"
                  priority={false}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-muted/50 to-muted/30" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-medium line-clamp-1">{it.title || "Untitled"}</div>
              <div className="text-[11px] text-green-700">Returned{it.returned_party ? ` to ${it.returned_party}` : ""}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 