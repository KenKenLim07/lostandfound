import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function AdminReturnsPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data, error } = await supabase
    .from("items")
    .select("id, title, name, type, returned_party, returned_year_section, returned_at")
    .eq("status", "returned")
    .order("returned_at", { ascending: false })
    .limit(100)

  if (error) {
    return <div className="text-sm text-destructive">Failed to load: {error.message}</div>
  }

  const rows = (data ?? []) as Array<Pick<Tables<"items">, "id" | "title" | "name" | "type" | "returned_party" | "returned_year_section" | "returned_at">>

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Returns</h2>
      <div className="rounded-md border divide-y">
        {rows.length ? rows.map((r) => (
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
        )) : (
          <div className="p-3 text-sm text-muted-foreground">No returns.</div>
        )}
      </div>
    </div>
  )
} 