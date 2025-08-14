"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"

type RecentReturn = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "returned_party" | "returned_year_section" | "returned_at">
type RecentPost = Pick<Tables<"items">, "id" | "title" | "name" | "created_at" | "type">

export type OverviewData = {
  totalCount: number
  activeCount: number
  activeLostCount: number
  activeFoundCount: number
  recentReturns: RecentReturn[]
  recentPosts: RecentPost[]
}

export function useOverviewData() {
  const supabase = createClientComponentClient<Database>()
  const [data, setData] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [{ count: totalCount }, { count: returnedCount }, { count: lostCount }, { count: foundCount }, recentReturns, recentPosts] = await Promise.all([
          supabase.from("items").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "returned"),
          supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "lost"),
          supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "found"),
          supabase
            .from("items")
            .select("id, title, name, type, returned_party, returned_year_section, returned_at")
            .eq("status", "returned")
            .order("returned_at", { ascending: false })
            .limit(10),
          supabase
            .from("items")
            .select("id, title, name, created_at, type")
            .order("created_at", { ascending: false })
            .limit(10),
        ])

        const activeCount = (totalCount ?? 0) - (returnedCount ?? 0)
        const activeLostCount = (lostCount ?? 0) - (await supabase.from("items").select("id", { count: "exact", head: true }).eq("type","lost").eq("status","returned")).count!
        const activeFoundCount = (foundCount ?? 0) - (await supabase.from("items").select("id", { count: "exact", head: true }).eq("type","found").eq("status","returned")).count!

        setData({
          totalCount: totalCount ?? 0,
          activeCount,
          activeLostCount: activeLostCount ?? 0,
          activeFoundCount: activeFoundCount ?? 0,
          recentReturns: recentReturns.data ?? [],
          recentPosts: recentPosts.data ?? [],
        })
      } catch (error) {
        console.error("Failed to load overview data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  return { data, isLoading }
}

export function AdminOverview() {
  const { data, isLoading } = useOverviewData()

  if (isLoading) {
    return <div className="space-y-6">Loading overview...</div>
  }

  if (!data) {
    return <div className="space-y-6">Failed to load overview data.</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Returns</h2>
          <div className="rounded-md border divide-y">
            {data.recentReturns.length > 0 ? (
              data.recentReturns.map((r) => (
                <div key={r.id} className="p-3 text-sm">
                  <div className="font-medium truncate">{r.title ?? "—"}</div>
                  <div className="text-muted-foreground">
                    {r.type === "found" ? "Returned to" : "Returned by"}: {r.returned_party ?? "—"}
                    {r.returned_year_section ? ` • ${r.returned_year_section}` : ""}
                  </div>
                  <div className="text-muted-foreground">
                    {r.returned_at ? new Date(r.returned_at).toLocaleString() : "—"}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground">No recent returns.</div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Posts</h2>
          <div className="rounded-md border divide-y">
            {data.recentPosts.length > 0 ? (
              data.recentPosts.map((p) => (
                <div key={p.id} className="p-3 text-sm">
                  <div className="font-medium truncate">{p.title ?? "—"}</div>
                  <div className="text-muted-foreground">{p.name} • {p.type.toUpperCase()} • {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</div>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground">No recent posts.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
} 