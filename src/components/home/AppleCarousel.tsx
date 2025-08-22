"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Tables } from "@/types/database"

type Item = Pick<Tables<"items">, "id" | "title" | "image_url" | "status" | "returned_at" | "created_at" | "returned_party"> 

export function AppleCarousel({ items }: { items: Item[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Auto-advance carousel
  useEffect(() => {
    const itemsWithImages = items.filter(item => item.image_url)
    if (itemsWithImages.length <= 1) return
    
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % itemsWithImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [items.length])

  const paginate = (newDirection: number) => {
    const itemsWithImages = items.filter(item => item.image_url)
    setDirection(newDirection)
    setCurrentIndex((prev) => (prev + newDirection + itemsWithImages.length) % itemsWithImages.length)
  }

  // Filter items to only show those with images
  const itemsWithImages = items.filter(item => item.image_url)
  
  if (itemsWithImages.length === 0) {
    return (
      <div className="pl-2 text-sm text-muted-foreground">No recent returns with images.</div>
    )
  }

  // Calculate indices for left, center, and right cards
  const leftIndex = (currentIndex - 1 + itemsWithImages.length) % itemsWithImages.length
  const centerIndex = currentIndex
  const rightIndex = (currentIndex + 1) % itemsWithImages.length

  const leftItem = itemsWithImages[leftIndex]
  const centerItem = itemsWithImages[centerIndex]
  const rightItem = itemsWithImages[rightIndex]

  return (
    <div className="relative w-full overflow-hidden">
      {/* Main carousel container */}
      <div className="relative h-48 sm:h-56 flex items-center justify-center">
        {/* Left Card (Previous) */}
        <motion.div
          key={`left-${leftItem.id}`}
          initial={{ x: direction === -1 ? 0 : -120, scale: direction === -1 ? 1 : 0.85, opacity: direction === -1 ? 1 : 0.7 }}
          animate={{ x: -120, scale: 0.85, opacity: 0.7, zIndex: 10 }}
          transition={{
            x: { type: "spring", stiffness: 150, damping: 35, mass: 1.5, duration: 1.2 },
            scale: { type: "spring", stiffness: 150, damping: 35, mass: 1.5, duration: 1.2 },
            opacity: { duration: 0.8, ease: "easeInOut" }
          }}
          className="absolute cursor-pointer w-40 sm:w-44 h-32 sm:h-36"
          onClick={() => paginate(-1)}
        >
          <Link href={`/items/${leftItem.id}?from=home`} className="block w-full h-full">
            <motion.div
              className="w-full h-full rounded-2xl border bg-white shadow-md overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative w-full h-3/4 overflow-hidden">
                <Image
                  src={leftItem.image_url!}
                  alt={leftItem.title || "Returned item"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 160px, 176px"
                  loading="lazy"
                />
              </div>
              <div className="p-2 flex items-center justify-center h-1/4">
                <div className="text-[10px] font-medium line-clamp-1 text-gray-900 text-center">
                  {leftItem.title || "Untitled"}
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Center Card (Current) */}
        <motion.div
          key={`center-${centerItem.id}`}
          initial={{ x: direction === -1 ? 120 : 0, scale: direction === -1 ? 0.85 : 1, opacity: direction === -1 ? 0.7 : 1 }}
          animate={{ x: 0, scale: 1, opacity: 1, zIndex: 20 }}
          transition={{
            x: { type: "spring", stiffness: 150, damping: 35, mass: 1.5, duration: 1.2 },
            scale: { type: "spring", stiffness: 150, damping: 35, mass: 1.5, duration: 1.2 },
            opacity: { duration: 0.8, ease: "easeInOut" }
          }}
          className="absolute cursor-pointer w-48 sm:w-56 h-40 sm:h-44"
        >
          <Link href={`/items/${centerItem.id}?from=home`} className="block w-full h-full">
            <motion.div
              className="w-full h-full rounded-2xl border bg-white shadow-xl ring-2 ring-primary/10 overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative w-full h-3/4 overflow-hidden">
                <Image
                  src={centerItem.image_url!}
                  alt={centerItem.title || "Returned item"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 192px, 224px"
                  loading="lazy"
                />
              </div>
              <div className="p-3 flex items-center justify-center h-1/4">
                <div className="text-xs font-medium line-clamp-1 text-gray-900 text-center">
                  {centerItem.title || "Untitled"}
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Right Card (Next) */}
        <motion.div
          key={`right-${rightItem.id}`}
          initial={{ x: 120, scale: 0.85, opacity: 0.7 }}
          animate={{ x: 120, scale: 0.85, opacity: 0.7, zIndex: 10 }}
          transition={{
            x: { type: "spring", stiffness: 150, damping: 35, mass: 1.5, duration: 1.2 },
            scale: { type: "spring", stiffness: 150, damping: 35, mass: 1.5, duration: 1.2 },
            opacity: { duration: 0.8, ease: "easeInOut" }
          }}
          className="absolute cursor-pointer w-40 sm:w-44 h-32 sm:h-36"
          onClick={() => paginate(1)}
        >
          <Link href={`/items/${rightItem.id}?from=home`} className="block w-full h-full">
            <motion.div
              className="w-full h-full rounded-2xl border bg-white shadow-md overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative w-full h-3/4 overflow-hidden">
                <Image
                  src={rightItem.image_url!}
                  alt={rightItem.title || "Returned item"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 160px, 176px"
                  loading="lazy"
                />
              </div>
              <div className="p-2 flex items-center justify-center h-1/4">
                <div className="text-[10px] font-medium line-clamp-1 text-gray-900 text-center">
                  {rightItem.title || "Untitled"}
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Navigation arrows */}
      {itemsWithImages.length > 1 && (
        <>
          <motion.button
            onClick={() => paginate(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </motion.button>
          
          <motion.button
            onClick={() => paginate(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </motion.button>
        </>
      )}

      {/* Dots indicator */}
      {itemsWithImages.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {itemsWithImages.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-primary' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
            />
          ))}
        </div>
      )}
    </div>
  )
} 