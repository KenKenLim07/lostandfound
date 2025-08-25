"use client"

import RotatingCarousel from "@/components/ui/RotatingCarousel"

// Example usage in your existing component
export default function CarouselUsageExample() {
  // Your images array - replace with your actual image URLs
  const images = [
    "/images/item1.jpg",
    "/images/item2.jpg", 
    "/images/item3.jpg",
    "/images/item4.jpg",
    "/images/item5.jpg",
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Featured Items</h1>
      
      {/* Basic usage with default settings */}
      <RotatingCarousel 
        images={images}
        className="mb-8"
      />
      
      {/* Custom configuration */}
      <RotatingCarousel 
        images={images}
        autoPlay={true}
        interval={4000}
        showControls={true}
        showAutoplayToggle={true}
        className="max-w-2xl mx-auto"
      />
    </div>
  )
} 