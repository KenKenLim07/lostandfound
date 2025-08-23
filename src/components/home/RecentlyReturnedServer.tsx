"use client"

import Link from "next/link"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { Carousel } from "@/components/ui/Carousel"
import { useEffect, useState } from "react"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

type Item = Pick<Tables<"items">, "id" | "title" | "image_url" | "status" | "returned_at" | "created_at" | "returned_party"> 

export default function RecentlyReturnedServer() {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchItems() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from("items")
    .select("id, title, image_url, status, returned_at, created_at, returned_party")
    .eq("status", "returned")
    .order("returned_at", { ascending: false, nullsFirst: false })
    .limit(12)
  
      setItems(data || [])
      setIsLoading(false)
    }

    fetchItems()
  }, [])
  
  // Extract image URLs and titles for carousel
  const carouselData = items
    .slice(0, 8)
    .filter(item => item.image_url)
    .map(item => ({
      image: item.image_url,
      title: item.title
    }))
  
  const carouselImages = carouselData.map(item => item.image!).filter(Boolean)
  const carouselTitles = carouselData.map(item => item.title).filter((title): title is string => Boolean(title))
  
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
  
  const finalImages = carouselImages.length >= 3 ? carouselImages : dummyImages
  const finalTitles = carouselTitles.length >= 3 ? carouselTitles : dummyTitles
  
  const handleCardClick = (index: number) => {
    if (items[index]) {
      window.open(`/items/${items[index].id}?from=home`, '_blank')
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

  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="mb-2 px-2">
        <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Returned</h2>
      </div>
      {items.length === 0 ? (
        <div className="pl-2 text-sm text-muted-foreground">No recent returns.</div>
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