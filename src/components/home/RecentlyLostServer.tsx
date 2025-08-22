import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import ItemsGridClient, { GridItem } from "@/components/home/ItemsGridClient"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

type Item = Pick<Tables<"items">, "id" | "title" | "type" | "description" | "date" | "location" | "image_url" | "status" | "created_at" | "user_id">

export default async function RecentlyLostServer() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from("items")
    .select("id, title, type, description, date, location, image_url, status, created_at, user_id")
    .eq("type", "lost")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12)
  
  const items: Item[] = (data || [])
  const grid: GridItem[] = items.slice(0, 6).map(i => ({
    id: i.id,
    title: i.title,
    type: "lost",
    description: i.description,
    date: i.date!,
    location: i.location,
    image_url: i.image_url,
    status: i.status as "active" | "returned" | null,
    created_at: i.created_at!,
  }))
  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="pl-2 flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold tracking-tight">Recently Lost</h2>
        <Link href="/items?type=lost" className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded">View all lost</Link>
      </div>
      {grid.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">No recent lost items.</div>
      ) : (
        <ItemsGridClient items={grid} />
      )}
    </section>
  )
} 