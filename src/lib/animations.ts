// Animation variants for consistent animations across the app
import { Variants } from "framer-motion"

export const heroAnimations: {
  container: Variants
  title: Variants
  subtitle: Variants
  buttons: Variants
} = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  },
  title: {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },
  subtitle: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.1 }
    }
  },
  buttons: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 }
    }
  }
}

export const cardAnimations: {
  container: Variants
  item: Variants
  hover: Variants
  tap: Variants
} = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },
  hover: {
    hover: {
      y: -4,
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  },
  tap: {
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }
}

// Utility for reduced motion support
export const getReducedMotionVariants = (variants: Variants, shouldReduceMotion: boolean): Variants => {
  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    }
  }
  return variants
}

/**
 * Checks if animations should run for a given page/component
 * Only runs on first visit or page reload, not on client-side navigation
 */
export function shouldAnimateOnMount(componentKey: string): boolean {
  if (typeof window === 'undefined') return true // Server-side, always animate
  
  // In development mode, we need to distinguish between hot reload and navigation
  if (process.env.NODE_ENV === 'development') {
    const key = `animated_${componentKey}`
    const hasAnimated = sessionStorage.getItem(key)
    
    // Check if this is a hot reload by looking for a special hot reload marker
    const hotReloadKey = `hot_reload_${componentKey}`
    const lastHotReload = sessionStorage.getItem(hotReloadKey)
    const currentTime = Date.now()
    
    // If it's been more than 2 seconds since last hot reload, treat as fresh
    const isHotReload = lastHotReload && (currentTime - parseInt(lastHotReload)) < 2000
    
    if (isHotReload) {
      console.log(`🔍 [${componentKey}] shouldAnimateOnMount: DEV mode, hot reload detected, animating`)
      return true
    }
    
    // If we've animated before and it's not a hot reload, don't animate
    if (hasAnimated) {
      console.log(`🔍 [${componentKey}] shouldAnimateOnMount: DEV mode, already animated, skipping`)
      return false
    }
    
    console.log(`🔍 [${componentKey}] shouldAnimateOnMount: DEV mode, first time, animating`)
    return true
  }
  
  const key = `animated_${componentKey}`
  const hasAnimated = sessionStorage.getItem(key)
  
  console.log(`🔍 [${componentKey}] shouldAnimateOnMount: hasAnimated=${hasAnimated}`)
  return !hasAnimated
}

/**
 * Marks a component as having been animated
 * Call this after the animation starts, not during render
 */
export function markAsAnimated(componentKey: string): void {
  if (typeof window === 'undefined') return
  
  const key = `animated_${componentKey}`
  sessionStorage.setItem(key, 'true')
  
  // In development mode, also mark the hot reload time
  if (process.env.NODE_ENV === 'development') {
    const hotReloadKey = `hot_reload_${componentKey}`
    sessionStorage.setItem(hotReloadKey, Date.now().toString())
    console.log(`🎬 [${componentKey}] markAsAnimated: DEV mode, set storage key=${key} and hot reload time`)
  } else {
    console.log(`🎬 [${componentKey}] markAsAnimated: Set storage key=${key}`)
  }
}

/**
 * Resets animation state for a component (useful for testing or manual refresh)
 */
export function resetAnimationState(componentKey: string): void {
  if (typeof window === 'undefined') return
  
  const key = `animated_${componentKey}`
  const hotReloadKey = `hot_reload_${componentKey}`
  sessionStorage.removeItem(key)
  sessionStorage.removeItem(hotReloadKey)
  console.log(`🔄 [${componentKey}] resetAnimationState: Cleared storage keys=${key}, ${hotReloadKey}`)
}

/**
 * Gets initial animation state with smooth transition handling
 * Prevents blinking by using opacity transitions instead of instant visibility changes
 */
export function getInitialAnimationState(componentKey: string): "hidden" | "visible" {
  if (typeof window === 'undefined') return "hidden"
  
  // In development mode, we still want to test the persistence logic
  const key = `animated_${componentKey}`
  const hasAnimated = sessionStorage.getItem(key)
  
  // Check if this is a fresh page load vs client-side navigation
  // We'll use a combination of session storage and a navigation timestamp
  const navigationKey = `nav_${componentKey}`
  const lastNavigationTime = sessionStorage.getItem(navigationKey)
  const currentTime = Date.now()
  
  console.log(`🎭 [${componentKey}] getInitialAnimationState:`, {
    hasAnimated,
    lastNavigationTime,
    currentTime,
    timeDiff: lastNavigationTime ? currentTime - parseInt(lastNavigationTime) : 'N/A'
  })
  
  // If we've never navigated to this page, or if it's been more than 5 seconds
  // since the last navigation, treat it as a fresh load
  const isFreshLoad = !lastNavigationTime || (currentTime - parseInt(lastNavigationTime)) > 5000
  
  console.log(`🎭 [${componentKey}] getInitialAnimationState: isFreshLoad=${isFreshLoad}`)
  
  if (isFreshLoad) {
    // Fresh load - animate if we haven't animated before
    const result = hasAnimated ? "visible" : "hidden"
    console.log(`🎭 [${componentKey}] getInitialAnimationState: Fresh load, returning "${result}"`)
    return result
  } else {
    // Recent navigation - don't animate if we've animated before
    const result = hasAnimated ? "visible" : "hidden"
    console.log(`🎭 [${componentKey}] getInitialAnimationState: Recent navigation, returning "${result}"`)
    return result
  }
}

/**
 * Alternative approach: Use a simpler method to detect navigation
 * This checks if the page was loaded via browser navigation vs direct load
 */
export function getInitialAnimationStateSimple(componentKey: string): "hidden" | "visible" {
  if (typeof window === 'undefined') return "hidden"
  
  // In development mode, we need to handle hot reload vs navigation
  if (process.env.NODE_ENV === 'development') {
    const key = `animated_${componentKey}`
    const hasAnimated = sessionStorage.getItem(key)
    
    // Check if this is a hot reload
    const hotReloadKey = `hot_reload_${componentKey}`
    const lastHotReload = sessionStorage.getItem(hotReloadKey)
    const currentTime = Date.now()
    
    // If it's been more than 2 seconds since last hot reload, treat as fresh
    const isHotReload = lastHotReload && (currentTime - parseInt(lastHotReload)) < 2000
    
    if (isHotReload) {
      console.log(`🎭 [${componentKey}] getInitialAnimationStateSimple: DEV mode, hot reload detected, returning "hidden"`)
      return "hidden"
    }
    
    // If we've animated before and it's not a hot reload, show as visible
    const result = hasAnimated ? "visible" : "hidden"
    console.log(`🎭 [${componentKey}] getInitialAnimationStateSimple: DEV mode, hasAnimated=${hasAnimated}, returning "${result}"`)
    return result
  }
  
  const key = `animated_${componentKey}`
  const hasAnimated = sessionStorage.getItem(key)
  
  // Simple approach: if we've animated before, don't animate again
  // This is more reliable but less sophisticated
  const result = hasAnimated ? "visible" : "hidden"
  console.log(`🎭 [${componentKey}] getInitialAnimationStateSimple: hasAnimated=${hasAnimated}, returning "${result}"`)
  
  return result
}

/**
 * Marks the current time as a navigation to this component
 * Call this when the component mounts to track navigation timing
 */
export function markNavigationTime(componentKey: string): void {
  if (typeof window === 'undefined') return
  
  const navigationKey = `nav_${componentKey}`
  const currentTime = Date.now()
  sessionStorage.setItem(navigationKey, currentTime.toString())
  
  console.log(`📍 [${componentKey}] markNavigationTime: Set navigation time=${currentTime}, key=${navigationKey}`)
} 