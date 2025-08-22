import Link from "next/link"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"

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
      <div className="flex items-center justify-between mb-2 pl-2">
        <h2 className="text-base font-semibold tracking-tight">Recently Returned</h2>
        <Link href="/items?status=returned" className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded">View all</Link>
      </div>
      {items.length === 0 ? (
        <div className="pl-2 text-sm text-muted-foreground">No recent returns.</div>
      ) : (
        <div 
          className="flex gap-2 overflow-x-auto pl-2 pb-1 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
          aria-label="Recently returned items"
        >
          {items.slice(0, 8).map((it) => (
            <Link 
              key={it.id} 
              href={`/items/${it.id}?from=home`} 
              className="w-40 shrink-0 snap-start rounded-xl border bg-white shadow-xs p-2 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
            >
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                {it.image_url ? (
                  <Image
                    src={it.image_url}
                    alt={it.title || "Returned item"}
                    width={160}
                    height={90}
                    className="h-full w-full object-cover"
                    sizes="160px"
                    priority={false}
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-medium line-clamp-1">{it.title || "Untitled"}</div>
                <div className="text-[11px] text-green-700">Returned{it.returned_party ? ` to ${it.returned_party}` : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
} 