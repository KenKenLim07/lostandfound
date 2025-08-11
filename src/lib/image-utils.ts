export interface CompressedImage {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now()
          })

          const originalSize = file.size
          const compressedSize = compressedFile.size
          
          // Only use compressed file if it's actually smaller
          const finalFile = compressedSize < originalSize ? compressedFile : file
          const finalSize = Math.min(originalSize, compressedSize)
          const compressionRatio = ((originalSize - finalSize) / originalSize) * 100

          resolve({
            file: finalFile,
            originalSize,
            compressedSize: finalSize,
            compressionRatio
          })
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 