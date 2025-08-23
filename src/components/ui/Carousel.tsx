"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface CarouselProps {
  images: string[]
  titles?: string[]
  autoPlay?: boolean
  interval?: number
  className?: string
  onCardClick?: (index: number) => void
}

export function Carousel({ 
  images, 
  titles = [],
  autoPlay = true, 
  interval = 3000, 
  className = "",
  onCardClick 
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)


  const nextSlide = useCallback(() => {
    if (isTransitioning) return // Prevent rapid clicking during animation
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length, isTransitioning])

  const prevSlide = useCallback(() => {
    if (isTransitioning) return // Prevent rapid clicking during animation
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length, isTransitioning])



  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const timer = setInterval(nextSlide, interval)
    return () => clearInterval(timer)
  }, [autoPlay, interval, nextSlide])

  


  // Get the three visible indices (left, center, right)
  const getVisibleIndices = () => {
    const prev = (currentIndex - 1 + images.length) % images.length
    const next = (currentIndex + 1) % images.length
    return [prev, currentIndex, next]
  }

  const visibleIndices = getVisibleIndices()
  
  // Debug logging


  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 bg-muted rounded-xl ${className}`}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main carousel container */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <div className="flex items-center justify-center h-full perspective-1000">
          <AnimatePresence mode="sync" onExitComplete={() => setIsTransitioning(false)}>
                      {visibleIndices.map((index, position) => {
            const isCenter = position === 1
            const isLeft = position === 0
            const isRight = position === 2

            return (
              <motion.div
                key={`${index}-${position}`}
                className="absolute cursor-pointer transform-style-preserve-3d"
                // CARD DIMENSIONS
                // Center card: 192px × 160px (larger, more prominent)
                // Side cards: 160px × 128px (smaller, less prominent)
                style={{
                  width: isCenter ? "192px" : "160px",
                  height: isCenter ? "160px" : "128px",
                }}
                
                // INITIAL ANIMATION STATE (starting position)
                // Left card: starts at -160px (left position)
                // Center card: starts at +96px (60% coverage of the right card like a subtle curtain)
                // Right card: starts at +160px (right position, mostly visible behind center card)
                // Scale: Center starts smaller (0.9), sides start tiny (0.7)
                // Z-index: Center on top (20), sides below (5)
                // 3D Rotation: Cards rotate based on their position for depth
                initial={{
                  x: isLeft ? "-160px" : isCenter ? "96px" : "160px",
                  scale: isCenter ? 0.9 : 0.7,
                  opacity: 1,
                  zIndex: isCenter ? 20 : 5,
                  rotateY: isLeft ? "-10deg" : isCenter ? "10deg" : "10deg",
                }}
                
                // ANIMATED STATE (final position)
                // Left card: stays at -160px (left position)
                // Center card: moves to 0px (center position) - reveals the right card as it slides left from +120px
                // Right card: stays at +160px (right position) - becomes more visible as center card moves
                // Scale: Center grows to 1.1 (10% larger), sides stay at 0.8
                // Z-index: Center stays on top (20), sides stay below (5)
                // 3D Rotation: Cards rotate to their final positions with smooth transitions
                animate={{
                  x: isLeft ? "-160px" : isRight ? "160px" : "0px",
                  scale: isCenter ? 1.1 : 0.8,
                  opacity: 1,
                  zIndex: isCenter ? 20 : 5,
                  rotateY: isLeft ? "-10deg" : isRight ? "10deg" : "0deg",
                }}
                
                // EXIT ANIMATION (when card leaves)
                // Left card: slides to -160px (left position - stays in place)
                // Center card: slides to -160px (full range to left position) + SCALES DOWN to left card size + DIMENSIONS shrink to left card size
                // Right card: slides to 0px (full range to center) + SCALES UP to center card size + DIMENSIONS grow to center card size
                // Scale: Left stays at 0.8, Center scales down to 0.8, Right scales up to 1.1
                // Dimensions: Left stays 160×128, Center shrinks to 160×128, Right grows to 192×160
                // Z-index: Center (moving to left) gets highest priority (25), Left stays at (20), Right (moving to center) gets (20)
                // 3D Rotation: Cards rotate to their exit positions with smooth transitions
                exit={{
                  x: isLeft ? "-160px" : isRight ? "0px" : "-160px",
                  width: isLeft ? "160px" : isCenter ? "160px" : isRight ? "192px" : "160px",
                  height: isLeft ? "128px" : isCenter ? "128px" : isRight ? "160px" : "128px",
                  scale: isLeft ? 0.8 : isCenter ? 0.8 : isRight ? 1.1 : 0.8,
                  opacity: 1,
                  zIndex: isCenter ? 25 : isLeft ? 20 : isRight ? 20 : 5,
                  rotateY: isLeft ? "-10deg" : isRight ? "0deg" : "-10deg",
                  transition: {
                    type: "spring",
                    stiffness: 600,
                    damping: 50,
                    mass: 0.3,
                    duration: 0.15
                  }
                }}
                
                // ANIMATION TRANSITIONS (spring physics)
                // X-axis movement: Spring animation for smooth sliding
                //   - stiffness: 600 (faster, matches exit animation speed)
                //   - damping: 50 (higher damping for smoother settling)
                //   - mass: 0.3 (lighter mass for faster movement)
                //   - duration: 0.15s (matches exit animation duration)
                // Scale: Spring animation for size changes
                //   - stiffness: 600 (faster spring for smoother scaling)
                //   - damping: 50 (balanced damping for smooth settling)
                //   - mass: 0.3 (lighter mass for smoother scaling)
                //   - duration: 0.15s (faster scaling for better feel)
                // 3D Rotation: Spring animation for smooth rotation
                //   - stiffness: 600 (faster for smoother rotation)
                //   - damping: 50 (balanced damping for smooth settling)
                //   - mass: 0.3 (lighter mass for smoother rotation)
                //   - duration: 0.15s (faster rotation for better feel)
                transition={{
                  x: { 
                    type: "spring", 
                    stiffness: 600, 
                    damping: 50, 
                    mass: 0.3,
                    duration: 0.15
                  },
                  scale: { 
                    type: "spring", 
                    stiffness: 600, 
                    damping: 50, 
                    mass: 0.3,
                    duration: 0.15
                  },
                  rotateY: {
                    type: "spring",
                    stiffness: 600,
                    damping: 50,
                    mass: 0.3,
                    duration: 0.15
                  }
                }}


                // CLICK HANDLER
                onClick={() => onCardClick?.(index)}
                
                // HOVER ANIMATION (mouse over)
                // Center card: grows slightly (1.05 = 5% larger)
                // Side cards: shrink slightly (0.95 = 5% smaller)
                // Duration: 0.2s for quick response
                whileHover={{ 
                  scale: isCenter ? 1.05 : 0.95,
                  transition: { duration: 0.2 }
                }}
                
                // TAP ANIMATION (mouse click/touch)
                // Center card: grows a bit more (1.02 = 2% larger)
                // Side cards: shrink more (0.92 = 8% smaller)
                // Duration: 0.1s for instant feedback
                whileTap={{ 
                  scale: isCenter ? 1.02 : 0.92,
                  transition: { duration: 0.1 }
                }}
              >

                  {/* CARD CONTAINER */}
                  {/* Base styling: rounded corners, border, white background, shadow */}
                  {/* Center card gets extra shadow and ring for emphasis */}
                  {/* Side cards get blur effect for visual hierarchy */}
                  {/* transform-gpu: hardware acceleration for smooth animations */}
                  <div className={`w-full h-full rounded-2xl border bg-white shadow-md overflow-hidden transform-gpu ${
                    isCenter ? 'shadow-xl ring-2 ring-primary/10' : 'blur-[1px]'
                  }`}>
                    {/* IMAGE SECTION (75% of card height) */}
                    {/* object-cover: maintains aspect ratio, crops if needed */}
                    {/* draggable={false}: prevents image dragging during carousel interaction */}
                    <div className="relative w-full h-3/4 overflow-hidden">
                      <Image
                        src={images[index]}
                        alt={`Carousel item ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    
                    {/* TITLE SECTION (25% of card height) */}
                    {/* text-[10px]: small font size for compact display */}
                    {/* line-clamp-1: truncates long titles with ellipsis */}
                    {/* Fallback: shows "Item {index + 1}" if no title provided */}
                    <div className="p-2 flex items-center justify-center h-1/4">
                      <div className="text-[10px] font-medium line-clamp-1 text-gray-900 text-center">
                        {titles[index] || `Item ${index + 1}`}
                      </div>
                    </div>
                  </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>




    </div>
  )
}