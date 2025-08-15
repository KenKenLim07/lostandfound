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

// Debug logging
const DEBUG = true
function debugLog(message: string, data?: unknown) {
  if (DEBUG && typeof window !== 'undefined') {
    console.log(`🖼️ [ImagePreload] ${message}`, data || '')
  }
}

// Initialize memory cleanup for mobile
function initializeMemoryManagement() {
  if (isMobile && typeof window !== 'undefined') {
    debugLog('Initializing mobile memory management')
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
      debugLog(`Initializing cache from ${cacheKey}`, { cached: !!cached })
      
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, boolean>
        const cacheSize = Object.keys(parsed).length
        debugLog(`Loaded ${cacheSize} cached images`)
        
        Object.entries(parsed).forEach(([url, loaded]) => {
          if (loaded) {
            globalImageCache.set(url, true)
            debugLog(`Restored cached image`, { url: url.substring(0, 50) + '...' })
          }
        })
      }
      
      debugLog(`Global cache size after init`, globalImageCache.size)
    }
  } catch (error) {
    debugLog('Cache initialization error', error)
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
      debugLog(`Saved ${count} images to ${cacheKey}`)
    }
  } catch (error) {
    debugLog('Cache save error', error)
  }
}

// Mobile-specific image preloading with hardware acceleration
function preloadImageMobile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    debugLog(`Preloading image`, { url: url.substring(0, 50) + '...', isMobile })
    
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
        debugLog(`Image loaded successfully`, { url: url.substring(0, 50) + '...' })
        
        if (ctx) {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)
          
          // Store canvas data URL for mobile persistence
          try {
            canvas.toDataURL('image/jpeg', 0.8)
            globalImageCache.set(url, true)
            globalImageCache.set(`canvas_${url}`, true)
            debugLog(`Canvas persistence successful`, { url: url.substring(0, 50) + '...' })
            resolve(true)
          } catch (error) {
            debugLog(`Canvas persistence failed, falling back to standard`, error)
            globalImageCache.set(url, true)
            resolve(true)
          }
        } else {
          debugLog(`Canvas context not available, using standard cache`)
          globalImageCache.set(url, true)
          resolve(true)
        }
      }
    } else {
      // Desktop: Standard loading
      img.onload = () => {
        debugLog(`Desktop image loaded`, { url: url.substring(0, 50) + '...' })
        globalImageCache.set(url, true)
        resolve(true)
      }
    }
    
    img.onerror = (error) => {
      debugLog(`Image load failed`, { url: url.substring(0, 50) + '...', error })
      resolve(false)
    }
    
    img.src = url
  })
}

// Initialize cache and memory management on module load
if (typeof window !== 'undefined') {
  debugLog('Module initialized', { isMobile, userAgent: navigator.userAgent })
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
      debugLog('No image URL provided')
      setIsLoaded(false)
      setIsLoading(false)
      currentImageUrlRef.current = null
      return
    }

    // Prevent duplicate processing of the same image URL
    if (currentImageUrlRef.current === imageUrl && isInitializedRef.current) {
      debugLog(`Image URL already processed, skipping`)
      return
    }

    currentImageUrlRef.current = imageUrl
    isInitializedRef.current = true

    debugLog(`useImagePreload effect triggered`, { 
      imageUrl: imageUrl.substring(0, 50) + '...',
      globalCacheSize: globalImageCache.size,
      wasPreviouslyLoaded: globalImageCache.get(imageUrl)
    })

    // Check if image was previously loaded globally
    const wasPreviouslyLoaded = globalImageCache.get(imageUrl)
    if (wasPreviouslyLoaded) {
      debugLog(`Image found in global cache, setting loaded=true`)
      setIsLoaded(true)
      setIsLoading(false)
      return
    }

    // Check if image is currently being loaded
    const existingPromise = imageLoadPromises.get(imageUrl)
    if (existingPromise) {
      debugLog(`Image already loading, waiting for existing promise`)
      setIsLoading(true)
      existingPromise.then((loaded) => {
        setIsLoaded(loaded)
        setIsLoading(false)
      })
      return
    }

    // Load the image with mobile-specific optimizations
    debugLog(`Starting new image load`)
    setIsLoading(true)
    const loadPromise = preloadImageMobile(imageUrl)
    
    imageLoadPromises.set(imageUrl, loadPromise)
    
    loadPromise.then((loaded) => {
      debugLog(`Image load promise resolved`, { loaded, imageUrl: imageUrl.substring(0, 50) + '...' })
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
        debugLog(`Component unmounted, cleaning up load promise`)
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

  // Debug current state
  useEffect(() => {
    debugLog(`Image state changed`, { 
      imageUrl: imageUrl?.substring(0, 50) + '...',
      isLoaded, 
      isLoading, 
      globalCacheSize: globalImageCache.size 
    })
  }, [imageUrl, isLoaded, isLoading])

  return { isLoaded, isLoading, isMobile }
} 