"use client"

import RotatingCarousel from "@/components/ui/RotatingCarousel"

const sampleImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop",
]

export default function CarouselDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Rotating Image Carousel Demo</h2>
        <p className="text-muted-foreground mb-6">
          A smooth rotating carousel with Framer Motion animations, infinite looping, 
          manual navigation, autoplay, and mobile swipe gestures.
        </p>
      </div>

      {/* Default Carousel */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Carousel (Autoplay Enabled)</h3>
        <RotatingCarousel 
          images={sampleImages}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Manual Control Only */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Manual Control Only (No Autoplay)</h3>
        <RotatingCarousel 
          images={sampleImages}
          autoPlay={false}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Fast Autoplay */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Fast Autoplay (1.5s interval)</h3>
        <RotatingCarousel 
          images={sampleImages}
          interval={1500}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Minimal Controls */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Minimal Controls (No Autoplay Toggle)</h3>
        <RotatingCarousel 
          images={sampleImages}
          showAutoplayToggle={false}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Single Image */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Single Image (No Controls)</h3>
        <RotatingCarousel 
          images={[sampleImages[0]]}
          showControls={false}
          showAutoplayToggle={false}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  )
} 