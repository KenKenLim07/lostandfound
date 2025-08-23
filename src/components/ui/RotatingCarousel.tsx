"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface RotatingCarouselProps {
  images: string[]
  autoPlay?: boolean
  interval?: number
  className?: string
  showControls?: boolean
  showAutoplayToggle?: boolean
}

export default function RotatingCarousel({
  images,
  autoPlay = true,
  interval = 3000,
  className,
  showControls = true,
  showAutoplayToggle = true,
}: RotatingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoplayActive, setIsAutoplayActive] = useState(autoPlay)
  const [isDragging, setIsDragging] = useState(false)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)

  const totalImages = images.length

  if (totalImages === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 bg-muted rounded-lg", className)}>
        <p className="text-muted-foreground">No images to display</p>
      </div>
    )
  }

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages)
  }, [totalImages])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }, [totalImages])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 50

    if (info.offset.x > threshold) {
      prevSlide()
    } else if (info.offset.x < -threshold) {
      nextSlide()
    }
  }, [nextSlide, prevSlide])

  // Autoplay logic
  useEffect(() => {
    if (isAutoplayActive && totalImages > 1) {
      autoplayRef.current = setInterval(nextSlide, interval)
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [isAutoplayActive, interval, nextSlide, totalImages])

  // Pause autoplay on hover/touch
  const handleMouseEnter = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isAutoplayActive && totalImages > 1) {
      autoplayRef.current = setInterval(nextSlide, interval)
    }
  }, [isAutoplayActive, interval, nextSlide, totalImages])

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayActive((prev) => !prev)
  }, [])

  // Calculate positions for the 3 visible cards
  const getCardPosition = (index: number) => {
    const relativeIndex = (index - currentIndex + totalImages) % totalImages
    
    if (relativeIndex === 0) return "center"
    if (relativeIndex === 1) return "right"
    if (relativeIndex === totalImages - 1) return "left"
    
    return "hidden"
  }

  const getCardStyle = (position: string) => {
    switch (position) {
      case "center":
        return {
          scale: 1.1,
          zIndex: 20,
          opacity: 1,
          x: 0,
        }
      case "left":
        return {
          scale: 0.9,
          zIndex: 10,
          opacity: 0.7,
          x: "-100%",
        }
      case "right":
        return {
          scale: 0.9,
          zIndex: 10,
          opacity: 0.7,
          x: "100%",
        }
      default:
        return {
          scale: 0.8,
          zIndex: 0,
          opacity: 0,
          x: "200%",
        }
    }
  }

  return (
    <div 
      className={cn("relative w-full h-80 overflow-hidden rounded-xl bg-muted", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {images.map((image, index) => {
            const position = getCardPosition(index)
            const style = getCardStyle(position)
            
            if (position === "hidden") return null

            return (
              <motion.div
                key={`${index}-${currentIndex}`}
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={style}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
                drag={totalImages > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.05 }}
                style={{ touchAction: "pan-y" }}
              >
                <div className="relative w-64 h-48 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={image}
                    alt={`Carousel image ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      {showControls && totalImages > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            disabled={isDragging}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            disabled={isDragging}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Autoplay Toggle */}
      {showAutoplayToggle && totalImages > 1 && (
        <button
          onClick={toggleAutoplay}
          className="absolute bottom-4 right-4 z-30 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
          aria-label={isAutoplayActive ? "Pause autoplay" : "Start autoplay"}
        >
          {isAutoplayActive ? (
            <Pause className="w-4 h-4 text-gray-700" />
          ) : (
            <Play className="w-4 h-4 text-gray-700" />
          )}
        </button>
      )}

      {/* Dots Indicator */}
      {totalImages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isDragging}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Gradient Overlays for Better Visibility */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/20 to-transparent" />
      </div>
    </div>
  )
} 