import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { RecentlyReturnedCarousel } from "./RecentlyReturnedCarousel"

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
    .order("returned_at", { ascending: false, nullsFirst: false })
    .limit(12)
  
  const items: Item[] = (data || [])
  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="mb-2 px-2">
        <h2 className="text-lg font-bold text-foreground/80 tracking-tight">Recently Returned</h2>
      </div>
      <RecentlyReturnedCarousel items={items} />
    </section>
  )
} 