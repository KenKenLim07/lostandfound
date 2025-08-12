import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  const [{ count: totalCount }, { count: returnedCount }, { count: lostCount }, { count: foundCount }, recentReturns, recentPosts] = await Promise.all([
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "returned"),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "lost"),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "found"),
    supabase
      .from("items")
      .select("id, title, name, returned_to, returned_year_section, returned_at")
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

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Items" value={totalCount ?? 0} />
        <KpiCard label="Active" value={activeCount} />
        <KpiCard label="Active Lost" value={activeLostCount ?? 0} />
        <KpiCard label="Active Found" value={activeFoundCount ?? 0} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Returns</h2>
          <div className="rounded-md border divide-y">
            {recentReturns.data && recentReturns.data.length > 0 ? (
              recentReturns.data.map((r) => (
                <div key={r.id} className="p-3 text-sm">
                  <div className="font-medium truncate">{r.title ?? "—"}</div>
                  <div className="text-muted-foreground">
                    Returned to {r.returned_to ?? "—"}
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
            {recentPosts.data && recentPosts.data.length > 0 ? (
              recentPosts.data.map((p) => (
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

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
} 