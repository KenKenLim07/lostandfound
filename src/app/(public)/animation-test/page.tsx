"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { shouldAnimateOnMount, markAsAnimated, resetAnimationState, getInitialAnimationState, markNavigationTime } from "@/lib/animations"
import { useState, useEffect } from "react"

const testAnimations = {
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  },
  item: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" as const }
    }
  }
}

export default function AnimationTestPage() {
  const [hasAnimated, setHasAnimated] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const shouldAnimate = shouldAnimateOnMount('animation-test')
    setHasAnimated(shouldAnimate)
  }, [])

  // Track navigation time for animation state management
  useEffect(() => {
    markNavigationTime('animation-test')
  }, [])

  const handleReset = () => {
    resetAnimationState('animation-test')
    resetAnimationState('home-page')
    resetAnimationState('item-cards')
    resetAnimationState('animated-links')
    
    // Also clear navigation timing data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nav_animation-test')
      sessionStorage.removeItem('nav_home-page')
      sessionStorage.removeItem('nav_item-cards')
      sessionStorage.removeItem('nav_animated-links')
    }
    
    setHasAnimated(false)
    setCount(prev => prev + 1)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        className="text-center space-y-6"
        variants={testAnimations.container}
        initial={getInitialAnimationState('animation-test')}
        animate="visible"
        onAnimationStart={() => {
          if (shouldAnimateOnMount('animation-test')) {
            markAsAnimated('animation-test')
          }
        }}
      >
        <h1 className="text-3xl font-bold">Animation State Test</h1>
        <p className="text-muted-foreground">
          This page demonstrates the animation state management system.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm">
              <strong>Current State:</strong> {hasAnimated ? "Already animated" : "Will animate"}
            </p>
            <p className="text-sm text-muted-foreground">
              Navigate away and back to see the difference. The page will only animate on first visit or reload.
            </p>
          </div>

          <Button onClick={handleReset} variant="outline">
            Reset All Animation States (Count: {count})
          </Button>

          <div className="text-xs text-muted-foreground">
            <p>• Navigate to home page and back to test</p>
            <p>• Use the reset button to force animations again</p>
            <p>• Check browser dev tools → Application → Session Storage</p>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-4 mt-8"
          variants={testAnimations.container}
          initial={getInitialAnimationState('animation-test')}
          animate="visible"
          onAnimationStart={() => {
            if (shouldAnimateOnMount('animation-test')) {
              markAsAnimated('animation-test')
            }
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-24 bg-muted rounded-lg flex items-center justify-center"
              variants={testAnimations.item}
            >
              Item {i + 1}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
} 