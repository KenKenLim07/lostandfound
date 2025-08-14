/**
 * Image caching utility to prevent blinking/flashing when navigating back to pages
 */

class ImageCache {
  private cache = new Map<string, HTMLImageElement>()
  private maxSize = 100 // Maximum number of cached images

  /**
   * Preload an image and cache it
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