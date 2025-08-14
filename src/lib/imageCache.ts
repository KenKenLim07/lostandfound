/**
 * Image caching utility to prevent blinking/flashing when navigating back to pages
 */

// Detect mobile device
function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768
}

class ImageCache {
  private cache = new Map<string, HTMLImageElement>()
  private maxSize = isMobile() ? 50 : 100 // Smaller cache for mobile
  private mobileOptimizations = isMobile()

  /**
   * Preload an image and cache it with mobile optimizations
   */
  preload(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already cached
      if (this.cache.has(src)) {
        resolve()
        return
      }

      // Create new image element with mobile optimizations
      const img = new window.Image()
      
      // Mobile-specific optimizations
      if (this.mobileOptimizations) {
        // Force immediate loading on mobile
        img.loading = 'eager'
        // Set crossOrigin for better mobile caching
        img.crossOrigin = 'anonymous'
      }
      
      img.onload = () => {
        // Add to cache
        this.addToCache(src, img)
        
        // Mobile: Force image to stay in memory
        if (this.mobileOptimizations) {
          this.keepImageInMemory(img)
        }
        
        resolve()
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`))
      }
      
      // Start loading
      img.src = src
    })
  }

  /**
   * Keep image in memory on mobile (prevent garbage collection)
   */
  private keepImageInMemory(img: HTMLImageElement) {
    // Create a canvas to force the image to stay in memory
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = img.naturalWidth || 100
        canvas.height = img.naturalHeight || 100
        ctx.drawImage(img, 0, 0)
        // Store canvas reference to prevent GC
        ;(img as HTMLImageElement & { _canvas?: HTMLCanvasElement })._canvas = canvas
      }
    } catch {
      // Silently fail if canvas operations aren't supported
    }
  }

  /**
   * Get cached image element
   */
  get(src: string): HTMLImageElement | undefined {
    return this.cache.get(src)
  }

  /**
   * Check if image is cached
   */
  has(src: string): boolean {
    return this.cache.has(src)
  }

  /**
   * Add image to cache with size management
   */
  private addToCache(src: string, img: HTMLImageElement) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(src, img)
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size
  }

  /**
   * Mobile-specific: Preload critical images with higher priority
   */
  preloadCritical(urls: string[]): Promise<void> {
    if (!this.mobileOptimizations) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      // On mobile, preload critical images immediately
      const promises = urls.slice(0, 10).map(url => this.preload(url))
      Promise.all(promises).then(() => resolve()).catch(() => resolve())
    })
  }
}

// Export singleton instance
export const imageCache = new ImageCache()

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => imageCache.preload(url).catch(() => {
    // Silently fail for individual images
    console.warn(`Failed to preload image: ${url}`)
  }))
  
  await Promise.all(promises)
}

/**
 * Preload images for a list of items with mobile optimizations
 */
export function preloadItemImages(items: Array<{ image_url: string | null }>): void {
  const imageUrls = items
    .map(item => item.image_url)
    .filter((url): url is string => url !== null && !url.includes('your-bucket-url.supabase.co'))
  
  if (imageUrls.length > 0) {
    if (isMobile()) {
      // Mobile: Preload critical images first, then the rest
      const criticalUrls = imageUrls.slice(0, 6) // First 6 images
      const remainingUrls = imageUrls.slice(6)
      
      // Preload critical images immediately
      imageCache.preloadCritical(criticalUrls)
      
      // Preload remaining images in background
      preloadImages(remainingUrls).catch(() => {
        // Silently fail preloading
      })
    } else {
      // Desktop: Preload all images normally
      preloadImages(imageUrls).catch(() => {
        // Silently fail preloading
      })
    }
  }
} 