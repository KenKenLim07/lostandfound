import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { Trophy } from "lucide-react"

export const dynamic = "force-dynamic"

type ItemLite = Pick<Tables<"items">, "id" | "name" | "type" | "status" | "returned_party" | "returned_at">

type Leader = {
  actor: string
  count: number
  lastRecipient: string | null
  lastReturnedAt: string | null
}

function getActorAndRecipient(item: ItemLite): { actor: string | null; recipient: string | null } {
  // Actor = person who performed the return (credited)
  // Recipient = person who received the item (muted hint)
  if (item.type === "lost") {
    // Someone returned it to the reporter (owner)
    return { actor: item.returned_party ?? null, recipient: item.name ?? null }
  }
  // found: reporter found it and returned it to returned_party
  return { actor: item.name ?? null, recipient: item.returned_party ?? null }
}

export default async function CampusGuardianPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data, error } = await supabase
    .from("items")
    .select("id, name, type, status, returned_party, returned_at")
    .eq("status", "returned")
    .order("returned_at", { ascending: false })
    .limit(500)

  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold mb-2">Campus Guardians</h1>
        <p className="text-sm text-destructive">Failed to load leaderboard: {error.message}</p>
      </main>
    )
  }

  const rows = (data ?? []) as ItemLite[]

  // Aggregate by actor
  const map = new Map<string, Leader>()
  for (const r of rows) {
    const { actor, recipient } = getActorAndRecipient(r)
    if (!actor) continue
    const existing = map.get(actor)
    if (!existing) {
      map.set(actor, {
        actor,
        count: 1,
        lastRecipient: recipient ?? null,
        lastReturnedAt: r.returned_at ?? null,
      })
    } else {
      existing.count += 1
      // Keep the most recent recipient (rows are sorted by most recent first)
      if (!existing.lastReturnedAt && r.returned_at) {
        existing.lastRecipient = recipient ?? existing.lastRecipient
        existing.lastReturnedAt = r.returned_at
      }
    }
  }

  const leaderboard = Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  const trophyColor = (rank: number) => {
    if (rank === 0) return "text-yellow-500"
    if (rank === 1) return "text-slate-400"
    if (rank === 2) return "text-amber-700"
    return "text-muted-foreground"
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h1 className="text-xl sm:text-2xl font-bold">Campus Guardian</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Recognizing contributors who helped return items successfully. Rankings are based on total confirmed returns.
        </p>
      </header>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No returns yet.</div>
      ) : (
        <ol className="rounded-xl border overflow-hidden">
          {leaderboard.map((entry, idx) => (
            <li key={entry.actor} className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3 border-b last:border-b-0 bg-card">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-muted">
                  <span className="text-xs font-semibold tabular-nums">{idx + 1}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {idx < 3 && <Trophy className={`h-4 w-4 ${trophyColor(idx)}`} />}
                    <span className="font-semibold truncate">{entry.actor}</span>
                  </div>
                  {entry.lastRecipient && (
                    <div className="text-xs text-muted-foreground truncate">
                      returned to <span className="font-medium">{entry.lastRecipient}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium tabular-nums">
                  {entry.count} return{entry.count !== 1 ? "s" : ""}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        Notes:
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>For lost reports, we credit the person who returned the item and show the owner as recipient.</li>
          <li>For found reports, we credit the original reporter (finder) and show the owner as recipient.</li>
          <li>This can be refined by capturing an explicit “Returned by” name universally.</li>
        </ul>
      </div>
    </main>
  )
} 