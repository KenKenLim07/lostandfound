"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import type { Database, Tables } from "@/types/database"

type ReturnItem = Pick<Tables<"items">, "id" | "title" | "type" | "returned_party" | "returned_year_section" | "returned_at" | "user_id"> & {
  profile?: {
    full_name: string | null
    school_id: string | null
    year_section: string | null
  } | null
}

export function AdminReturnsList() {
  const supabase = useSupabase()
  const [data, setData] = useState<ReturnItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: rows, error } = await supabase
          .from("items")
          .select("id, title, type, returned_party, returned_year_section, returned_at, user_id")
          .eq("status", "returned")
          .order("returned_at", { ascending: false })
          .limit(100)

        if (error) throw error

        // Fetch profile data for each item
        const itemsWithProfiles: ReturnItem[] = await Promise.all(
          (rows || []).map(async (item) => {
            if (item.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, school_id, year_section")
                .eq("id", item.user_id)
                .single()
              return { ...item, profile: profile || undefined }
            }
            return { ...item, profile: undefined }
          })
        )

        setData(itemsWithProfiles)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load returns")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading returns...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load: {error}</div>
  }

  return (
    <div className="rounded-md border divide-y">
      {data.length ? data.map((r) => (
        <div key={r.id} className="p-3 text-sm">
          <div className="font-medium truncate">{r.title ?? "—"}</div>
          <div className="text-muted-foreground">
            Posted by: {r.profile?.full_name || "Unknown User"}
            {r.profile?.year_section ? ` • ${r.profile.year_section}` : ""}
          </div>
          <div className="text-muted-foreground">
            {r.type === "found" ? "Returned to" : "Returned by"}: {r.returned_party ?? "—"}
            {r.returned_year_section ? ` • ${r.returned_year_section}` : ""}
          </div>
          <div className="text-muted-foreground">
            {r.returned_at ? new Date(r.returned_at).toLocaleString() : "—"}
          </div>
        </div>
      )) : (
        <div className="p-3 text-sm text-muted-foreground">No returns.</div>
      )}
    </div>
  )
} 