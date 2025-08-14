/**
 * Image caching utility to prevent blinking/flashing when navigating back to pages
 * Enhanced for mobile devices with aggressive caching
 */

class ImageCache {
  private cache = new Map<string, HTMLImageElement>()
  private maxSize = 200 // Increased for mobile devices
  private mobileCache = new Map<string, string>() // Base64 cache for mobile
  private isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

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

      // Create new image element
      const img = new window.Image()
      
      img.onload = () => {
        // Add to cache
        this.addToCache(src, img)
        
        // For mobile, also create a base64 version for persistent storage
        if (this.isMobile) {
          this.createMobileCache(src, img)
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
   * Create mobile-specific cache using base64
   */
  private createMobileCache(src: string, img: HTMLImageElement) {
    try {
      // Create canvas to convert to base64
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
        
        // Convert to base64 with reduced quality for mobile
        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        this.mobileCache.set(src, base64)
        
        // Store in sessionStorage for persistence across navigation
        try {
          sessionStorage.setItem(`img_cache_${this.hashString(src)}`, base64)
        } catch (e) {
          // Session storage might be full, ignore
        }
      }
    } catch (e) {
      // Fallback if canvas conversion fails
      console.warn('Failed to create mobile cache for image:', src)
    }
  }

  /**
   * Simple string hash for storage keys
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
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
    return this.cache.has(src) || this.mobileCache.has(src)
  }

  /**
   * Get mobile cached version (base64)
   */
  getMobileCache(src: string): string | undefined {
    // First check memory cache
    if (this.mobileCache.has(src)) {
      return this.mobileCache.get(src)
    }
    
    // Then check session storage
    try {
      const stored = sessionStorage.getItem(`img_cache_${this.hashString(src)}`)
      if (stored) {
        this.mobileCache.set(src, stored)
        return stored
      }
    } catch (e) {
      // Session storage might be unavailable
    }
    
    return undefined
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
    this.mobileCache.clear()
    
    // Clear session storage cache
    try {
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('img_cache_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      // Session storage might be unavailable
    }
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size + this.mobileCache.size
  }

  /**
   * Check if mobile device
   */
  get isMobileDevice() {
    return this.isMobile
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
 * Preload images for a list of items
 */
export function preloadItemImages(items: Array<{ image_url: string | null }>): void {
  const imageUrls = items
    .map(item => item.image_url)
    .filter((url): url is string => url !== null && !url.includes('your-bucket-url.supabase.co'))
  
  if (imageUrls.length > 0) {
    preloadImages(imageUrls).catch(() => {
      // Silently fail preloading
    })
  }
} 