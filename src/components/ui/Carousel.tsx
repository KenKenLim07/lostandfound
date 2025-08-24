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
  const [leftImageIndex, setLeftImageIndex] = useState(0) // Only stagger left position


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
          <AnimatePresence mode="sync" onExitComplete={() => {
            setIsTransitioning(false)
            // Update left image index only after animation completes
            const newLeftIndex = (currentIndex - 1 + images.length) % images.length
            setLeftImageIndex(newLeftIndex)
          }}>
                      {visibleIndices.map((index, position) => {
            const isCenter = position === 1
            const isLeft = position === 0
            const isRight = position === 2

            return (
              <motion.div
                key={`transition-${currentIndex}-${position}-${index}`}
                className={`absolute cursor-pointer transform-style-preserve-3d ${
                  isCenter 
                    ? 'w-36 h-30 sm:w-48 sm:h-40' 
                    : 'w-30 h-24 sm:w-40 sm:h-32'
                }`}
                
                // INITIAL ANIMATION STATE (starting position)
                // Mobile: Left card: starts at -120px, Center card: starts at +72px, Right card: starts at +120px
                // Desktop: Left card: starts at -160px, Center card: starts at +96px, Right card: starts at +160px
                // Scale: Center starts smaller (0.9), sides start tiny (0.7)
                // Z-index: Center on top (20), sides below (5)
                // 3D Rotation: Cards rotate based on their position for depth
                initial={{
                  x: isLeft ? "-120px" : isCenter ? "72px" : "120px",
                  scale: isCenter ? 0.9 : 0.7,
                  opacity: 1,
                  zIndex: isCenter ? 20 : 5,
                  rotateY: isLeft ? "-10deg" : isCenter ? "10deg" : "10deg",
                }}
                
                // ANIMATED STATE (final position)
                // Mobile: Left card: stays at -120px, Center card: moves to 0px, Right card: stays at +120px
                // Desktop: Left card: stays at -160px, Center card: moves to 0px, Right card: stays at +160px
                // Scale: Center grows to 1.1 (10% larger), sides stay at 0.8
                // Z-index: Center stays on top (20), sides stay below (5)
                // 3D Rotation: Cards rotate to their final positions with smooth transitions
                animate={{
                  x: isLeft ? "-120px" : isRight ? "120px" : "0px",
                  scale: isCenter ? 1.1 : 0.8,
                  opacity: 1,
                  zIndex: isCenter ? 20 : 5,
                  rotateY: isLeft ? "-10deg" : isRight ? "10deg" : "0deg",
                }}
                
                // EXIT ANIMATION (when card leaves)
                // Mobile: Left card: slides to -120px, Center card: slides to -120px, Right card: slides to 0px
                // Desktop: Left card: slides to -160px, Center card: slides to -160px, Right card: slides to 0px
                // Scale: Left stays at 0.8, Center scales down to 0.8, Right scales up to 1.1
                // Dimensions: Left stays 120×96, Center shrinks to 120×96, Right grows to 144×120
                // Z-index: Center (moving to left) gets lower priority (10), Left stays at (5), Right (moving to center) gets highest priority (25)
                // 3D Rotation: Cards rotate to their exit positions with smooth transitions
                exit={{
                  x: isLeft ? "-120px" : isRight ? "0px" : "-120px",
                  width: isLeft ? "120px" : isCenter ? "120px" : isRight ? "144px" : "120px",
                  height: isLeft ? "96px" : isCenter ? "96px" : isRight ? "120px" : "96px",
                  scale: isLeft ? 0.8 : isCenter ? 0.8 : isRight ? 1.1 : 0.8,
                  opacity: 1,
                  zIndex: isLeft ? 5 : isCenter ? 10 : isRight ? 25 : 5,
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
                        src={images[position === 0 ? leftImageIndex : index]}
                        alt={`Carousel item ${(position === 0 ? leftImageIndex : index) + 1}`}
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