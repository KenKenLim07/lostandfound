"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { Carousel } from "@/components/ui/Carousel"
import { useQuery } from "@tanstack/react-query"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Custom hook for fetching recently returned items
function useRecentlyReturnedItems() {
  return useQuery({
    queryKey: ['recently-returned'],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data } = await supabase
        .from("items")
        .select("id, title, image_url, status, returned_at, created_at, returned_party")
        .eq("status", "returned")
        .order("returned_at", { ascending: false, nullsFirst: false })
        .limit(12)
      
      return data || []
    },
    // Cache for 5 minutes, keep in cache for 10 minutes
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export default function RecentlyReturnedServer() {
  const { data: items = [], isLoading, error } = useRecentlyReturnedItems()
  
  // Extract image URLs and titles for carousel - only items with images
  const carouselData = items
    .filter(item => {
      // More comprehensive filtering to catch all invalid image cases
      const hasValidImage = item.image_url && 
                           typeof item.image_url === 'string' && 
                           item.image_url.trim() !== '' && 
                           item.image_url !== 'null' && 
                           item.image_url !== 'undefined'
      return hasValidImage
    })
    .slice(0, 8) // Limit to 8 items
    .map(item => ({
      id: item.id, // Keep the ID for proper click handling
      image: item.image_url,
      title: item.title
    }))
  
  const carouselImages = carouselData.map(item => item.image!).filter(Boolean)
  const carouselTitles = carouselData.map(item => item.title).filter((title): title is string => Boolean(title))
  
  // Only show carousel if we have at least 3 items with images
  const hasEnoughImages = carouselImages.length >= 3
  
  // Add fallback images and titles if we don't have enough
  const dummyData = [
    { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop", title: "Lost iPhone" },
    { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop", title: "Found Keys" },
    { image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", title: "Lost Wallet" },
    { image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop", title: "Found Watch" },
    { image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop", title: "Lost Backpack" }
  ]
  
  const dummyImages = dummyData.map(item => item.image)
  const dummyTitles = dummyData.map(item => item.title)
  
  const finalImages = hasEnoughImages ? carouselImages : dummyImages
  const finalTitles = hasEnoughImages ? carouselTitles : dummyTitles
  
  const handleCardClick = (index: number) => {
    if (hasEnoughImages && carouselData[index]) {
      // Only open item page if we have real data (not dummy data)
      window.open(`/items/${carouselData[index].id}?from=home`, '_blank')
    }
  }
  
  if (isLoading) {
    return (
      <section className="container mx-auto px-0.5 sm:px-4 py-2">
        <div className="mb-2 px-2">
          <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Returned</h2>
        </div>
        <div className="px-2">
          <div className="relative h-48 sm:h-64 overflow-hidden rounded-xl bg-muted animate-pulse" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="container mx-auto px-0.5 sm:px-4 py-2">
        <div className="mb-2 px-2">
          <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Returned</h2>
        </div>
        <div className="pl-2 text-sm text-muted-foreground">Unable to load recent returns.</div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="mb-2 px-2">
        <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Returned</h2>
      </div>
      {items.length === 0 ? (
        <div className="pl-2 text-sm text-muted-foreground">No recent returns.</div>
      ) : !hasEnoughImages ? (
        <div className="pl-2 text-sm text-muted-foreground">No recent returns with images available.</div>
      ) : (
        <div className="px-2">
          <Carousel 
            images={finalImages}
            titles={finalTitles}
            autoPlay={true}
            interval={4000}
            onCardClick={handleCardClick}
            className="max-w-4xl mx-auto"
          />
        </div>
      )}
    </section>
  )
} 