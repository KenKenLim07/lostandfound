"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface CarouselItem {
  id: string
  title: string | null
  image_url: string | null
  returned_party?: string | null
}

interface RecentReturnedCarouselProps {
  items: CarouselItem[]
  className?: string
}

export function RecentReturnedCarousel({ items, className = "" }: RecentReturnedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<NodeJS.Timeout>()

  // Handle infinite loop
  const getIndex = useCallback((index: number) => {
    if (items.length === 0) return 0
    return ((index % items.length) + items.length) % items.length
  }, [items.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => getIndex(prev + 1))
  }, [getIndex])

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => getIndex(prev - 1))
  }, [getIndex])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Autoplay functionality
  useEffect(() => {
    if (items.length <= 1) return

    autoplayRef.current = setInterval(() => {
      if (!isDragging) {
        goToNext()
      }
    }, 5000) // Change slide every 5 seconds

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [goToNext, isDragging, items.length])

  // Pause autoplay on hover
  const handleMouseEnter = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (items.length > 1) {
      autoplayRef.current = setInterval(() => {
        if (!isDragging) {
          goToNext()
        }
      }, 5000)
    }
  }, [goToNext, isDragging, items.length])

  // Handle drag gestures
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    
    const swipeThreshold = 50
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        goToPrevious()
      } else {
        goToNext()
      }
    }
  }, [goToNext, goToPrevious])

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No recent returns.</p>
      </div>
    )
  }

  if (items.length === 1) {
    const item = items[0]
    return (
      <div className={`relative ${className}`}>
        <div className="flex justify-center">
          <Link 
            href={`/items/${item.id}?from=home`}
            className="group block w-full max-w-[280px] sm:max-w-md mx-auto"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted/20">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title || "Returned item"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority={true}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-muted-foreground text-sm">No image</div>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <h3 className="font-medium text-foreground line-clamp-1">
                {item.title || "Untitled"}
              </h3>
              <p className="text-sm text-green-600 mt-1">
                Returned{item.returned_party ? ` to ${item.returned_party}` : ""}
              </p>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}

    >
      {/* Main Carousel Container */}
      <div className="relative overflow-hidden rounded-3xl bg-muted/5 px-4 sm:px-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: 0.4 },
              x: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
            className="relative aspect-[16/9] w-full max-w-[280px] sm:max-w-md mx-auto rounded-2xl"
          >
            <Link 
              href={`/items/${items[currentIndex].id}?from=home`}
              className="block h-full w-full"
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl">
                {items[currentIndex].image_url ? (
                  <Image
                    src={items[currentIndex].image_url}
                    alt={items[currentIndex].title || "Returned item"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                    priority={true}
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/20">
                    <div className="text-muted-foreground text-sm">No image</div>
                  </div>
                )}
                
                {/* Stronger gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Item info overlay with better positioning and readability */}
                <div className="absolute bottom-0 left-0 right-0 p-1 text-white">
                  <h3 className="font-bold text-lg line-clamp-1 text-white drop-shadow-lg">
                    {items[currentIndex].title || "Untitled"}
                  </h3>
                  <p className="text-xs font-medium text-green-300 drop-shadow-lg">
                    Returned{items[currentIndex].returned_party ? ` to ${items[currentIndex].returned_party}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Touch/Drag Area */}
        <motion.div
          ref={containerRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 0.98 }}
        />

        {/* Navigation Buttons */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-300 ease-out border-0 p-0 shadow-lg hover:shadow-xl"
            aria-label="Previous item"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-300 ease-out border-0 p-0 shadow-lg hover:shadow-xl"
            aria-label="Next item"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Indicator - Removed in favor of enhanced thumbnails */}
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex justify-center items-center lg:mt-1 space-x-2 lg:space-x-3 overflow-x-auto px-4 py-2 rounded-2xl">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => goToIndex(index)}
                            className={`relative group/thumb transition-all duration-500 ease-out ${
              index === currentIndex
                ? "scale-110"
                : "hover:scale-105"
            }`}
          >
            <div className={`relative h-12 w-12 lg:h-16 lg:w-16 overflow-hidden rounded-xl bg-muted/20 flex items-center justify-center transition-all duration-500 ease-out ${
              index === currentIndex ? "border-2 border-black" : ""
            }`}>
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title || "Returned item"}
                  fill
                  className={`object-cover transition-all duration-500 ease-out ${
                    index === currentIndex ? "scale-125" : "group-hover/thumb:scale-110 blur-[1.5px]"
                  }`}
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-muted-foreground text-xs">No image</div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-lg bg-black/0 transition-colors duration-300 group-hover/thumb:bg-black/10" />
          </button>
        ))}
      </div>
    </div>
  )
} 