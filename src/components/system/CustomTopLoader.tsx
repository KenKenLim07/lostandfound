"use client"

import { useEffect, useState } from "react"

interface CustomTopLoaderProps {
  isLoading: boolean
  color?: string
  height?: number
  duration?: number
}

export function CustomTopLoader({ 
  isLoading, 
  color = "#000000", 
  height = 3, 
  duration = 200 
}: CustomTopLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setProgress(0)
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      return () => clearInterval(interval)
    } else {
      // Complete the progress bar
      setProgress(100)
      
      // Hide after completion
      const timer = setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isLoading, duration])

  if (!isVisible) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] transition-all duration-200 ease-out"
      style={{ 
        height: `${height}px`,
        backgroundColor: color,
        transform: `translateX(-${100 - progress}%)`,
        transition: `transform ${duration}ms ease-out`
      }}
    />
  )
} 