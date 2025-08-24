import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { RecentReturnedCarousel } from "./RecentReturnedCarousel"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

type Item = Pick<Tables<"items">, "id" | "title" | "image_url" | "status" | "returned_at" | "created_at" | "returned_party"> 

export default async function RecentlyReturnedServer() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from("items")
    .select("id, title, image_url, status, returned_at, created_at, returned_party")
    .eq("status", "returned")
    .not("image_url", "is", null) // Filter out items without images
    .order("returned_at", { ascending: false, nullsFirst: false })
    .limit(20) // Fetch more to ensure we have enough after filtering
  
  // Process and filter items for display
  const items: Item[] = (data || [])
    .filter(item => item.image_url && item.image_url.trim() !== "") // Additional validation
    .slice(0, 6) // Limit to exactly 6 items for display
  
  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="mb-2 px-2">
        <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Returned</h2>
      </div>
      {items.length === 0 ? (
        <div className="pl-2 text-sm text-muted-foreground">
          {data && data.length > 0 
            ? "No recent returns with images available." 
            : "No recent returns."
          }
        </div>
      ) : (
        <RecentReturnedCarousel items={items} />
      )}
    </section>
  )
} 