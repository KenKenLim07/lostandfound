"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import ItemsGridClient, { GridItem } from "@/components/home/ItemsGridClient"
import { useQuery } from "@tanstack/react-query"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

type Item = Pick<Database["public"]["Tables"]["items"]["Row"], "id" | "title" | "type" | "description" | "date" | "location" | "image_url" | "status" | "created_at" | "user_id">

// Custom hook for fetching recently found items
function useRecentlyFoundItems() {
  return useQuery({
    queryKey: ['recentlyFoundItems'],
    queryFn: async (): Promise<Item[]> => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("items")
        .select("id, title, type, description, date, location, image_url, status, created_at, user_id")
        .eq("type", "found")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12)
      
      if (error) {
        throw new Error(`Failed to fetch recently found items: ${error.message}`)
      }
      
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
}

export default function RecentlyFoundServer() {
  const { data: items = [], isLoading, error } = useRecentlyFoundItems()
  
  const grid: GridItem[] = items.slice(0, 6).map(i => ({
    id: i.id,
    title: i.title,
    type: "found",
    description: i.description,
    date: i.date!,
    location: i.location,
    image_url: i.image_url,
    status: i.status as "active" | "returned" | null,
    created_at: i.created_at!,
  }))

  if (error) {
    return (
      <section className="container mx-auto px-0.5 sm:px-4 py-2">
        <div className="pl-2 mb-2">
          <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Found</h2>
        </div>
        <div className="text-center py-6 text-sm text-red-500">
          Error loading recently found items. Please try again later.
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="pl-2 mb-2">
        <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Found</h2>
      </div>
      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">Loading recently found items...</div>
      ) : grid.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">No recent found items.</div>
      ) : (
        <ItemsGridClient items={grid} />
      )}
    </section>
  )
} 