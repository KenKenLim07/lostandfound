import { useState, useEffect, useRef } from 'react'

// Global image cache to prevent re-downloading and blinking
const globalImageCache = new Map<string, boolean>()
const imageLoadPromises = new Map<string, Promise<boolean>>()

// Session storage key for persistent image cache
const IMAGE_CACHE_KEY = 'image_cache_v1'

// Device detection for mobile-specific optimizations
const isMobile = typeof window !== 'undefined' && (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth <= 768
)

// Mobile-specific cache key (separate from desktop)
const MOBILE_CACHE_KEY = 'mobile_image_cache_v1'

// Memory management for mobile devices
let memoryCleanupInterval: NodeJS.Timeout | null = null



// Initialize memory cleanup for mobile
function initializeMemoryManagement() {
  if (isMobile && typeof window !== 'undefined') {
    // Clean up memory every 30 seconds on mobile
    memoryCleanupInterval = setInterval(() => {
      // Clear old canvas references to prevent memory leaks
      globalImageCache.forEach((loaded, url) => {
        if (url.startsWith('canvas_')) {
          globalImageCache.delete(url)
        }
      })
      
      // Force garbage collection hint (browser may ignore)
      if ('gc' in window) {
        (window as { gc?: () => void }).gc?.()
      }
    }, 30000)
    
    // Clean up on page unload
    window.addEventListener('beforeunload', cleanupMemory)
    window.addEventListener('pagehide', cleanupMemory)
  }
}

// Cleanup memory
function cleanupMemory() {
  if (memoryCleanupInterval) {
    clearInterval(memoryCleanupInterval)
    memoryCleanupInterval = null
  }
  
  // Clear canvas cache on mobile
  if (isMobile) {
    globalImageCache.forEach((loaded, url) => {
      if (url.startsWith('canvas_')) {
        globalImageCache.delete(url)
      }
    })
  }
}

// Initialize cache from session storage
function initializeCache() {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = isMobile ? MOBILE_CACHE_KEY : IMAGE_CACHE_KEY
      const cached = sessionStorage.getItem(cacheKey)
      
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, boolean>
        
        Object.entries(parsed).forEach(([url, loaded]) => {
          if (loaded) {
            globalImageCache.set(url, true)
          }
        })
      }
    }
  } catch {
    // Ignore cache errors
  }
}

// Save cache to session storage with mobile-specific handling
function saveCache() {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = isMobile ? MOBILE_CACHE_KEY : IMAGE_CACHE_KEY
      const cacheObject: Record<string, boolean> = {}
      
      // Mobile: Limit cache size to prevent memory pressure
      const maxCacheSize = isMobile ? 50 : 200
      let count = 0
      
      globalImageCache.forEach((loaded, url) => {
        if (count < maxCacheSize && !url.startsWith('canvas_')) {
          cacheObject[url] = loaded
          count++
        }
      })
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject))
    }
  } catch {
    // Ignore cache errors
  }
}

// Mobile-specific image preloading with hardware acceleration
function preloadImageMobile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    
    // Mobile-specific optimizations
    if (isMobile) {
      // Force hardware acceleration on mobile
      img.style.transform = 'translateZ(0)'
      img.style.willChange = 'opacity'
      img.style.backfaceVisibility = 'hidden'
      
      // Use canvas for memory persistence on mobile
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      img.onload = () => {
        if (ctx) {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)
          
          // Store canvas data URL for mobile persistence
          try {
            canvas.toDataURL('image/jpeg', 0.8)
            globalImageCache.set(url, true)
            globalImageCache.set(`canvas_${url}`, true)
            resolve(true)
          } catch {
            globalImageCache.set(url, true)
            resolve(true)
          }
        } else {
          globalImageCache.set(url, true)
          resolve(true)
        }
      }
    } else {
      // Desktop: Standard loading
      img.onload = () => {
        globalImageCache.set(url, true)
        resolve(true)
      }
    }
    
    img.onerror = () => resolve(false)
    
    img.src = url
  })
}

// Initialize cache and memory management on module load
if (typeof window !== 'undefined') {
  initializeCache()
  initializeMemoryManagement()
}

export function useImagePreload(imageUrl: string | null) {
  // Initialize state based on cache immediately to prevent blinking
  const wasPreviouslyLoaded = imageUrl ? globalImageCache.get(imageUrl) : false
  const [isLoaded, setIsLoaded] = useState(wasPreviouslyLoaded)
  const [isLoading, setIsLoading] = useState(false)
  
  // Use ref to prevent unnecessary state updates and race conditions
  const currentImageUrlRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!imageUrl) {
      setIsLoaded(false)
      setIsLoading(false)
      currentImageUrlRef.current = null
      return
    }

    // Prevent duplicate processing of the same image URL
    if (currentImageUrlRef.current === imageUrl && isInitializedRef.current) {
      return
    }

    currentImageUrlRef.current = imageUrl
    isInitializedRef.current = true

    // Check if image was previously loaded globally
    const wasPreviouslyLoaded = globalImageCache.get(imageUrl)
    if (wasPreviouslyLoaded) {
      setIsLoaded(true)
      setIsLoading(false)
      return
    }

    // Check if image is currently being loaded
    const existingPromise = imageLoadPromises.get(imageUrl)
    if (existingPromise) {
      setIsLoading(true)
      existingPromise.then((loaded) => {
        setIsLoaded(loaded)
        setIsLoading(false)
      })
      return
    }

    // Load the image with mobile-specific optimizations
    setIsLoading(true)
    const loadPromise = preloadImageMobile(imageUrl)
    
    imageLoadPromises.set(imageUrl, loadPromise)
    
    loadPromise.then((loaded) => {
      setIsLoaded(loaded)
      setIsLoading(false)
      imageLoadPromises.delete(imageUrl)
      
      // Save cache after successful load
      if (loaded) {
        saveCache()
      }
    })

    return () => {
      // Cleanup if component unmounts before image loads
      if (imageLoadPromises.has(imageUrl)) {
        imageLoadPromises.delete(imageUrl)
      }
    }
  }, [imageUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMobile) {
        // Clean up mobile-specific resources
        cleanupMemory()
      }
    }
  }, [])

  return { isLoaded, isLoading, isMobile }
} 