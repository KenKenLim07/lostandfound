import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"

export const dynamic = "force-dynamic"

type ItemLite = Pick<Tables<"items">, "id" | "type" | "status" | "returned_party" | "returned_at" | "user_id"> & {
  profile?: {
    full_name: string | null
    school_id: string | null
    year_section: string | null
  } | null
}

type Leader = {
  actor: string
  count: number
  lastRecipient: string | null
  lastReturnedAt: string | null
}

function getActorAndRecipient(item: ItemLite): { actor: string | null; recipient: string | null } {
  if (item.type === "lost") {
    return { actor: item.returned_party ?? null, recipient: item.profile?.full_name ?? null }
  }
  return { actor: item.profile?.full_name ?? null, recipient: item.returned_party ?? null }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { data, error } = await supabase
      .from("items")
      .select("id, type, status, returned_party, returned_at, user_id")
      .eq("status", "returned")
      .order("returned_at", { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch profile data for each item
    const itemsWithProfiles: ItemLite[] = await Promise.all(
      (data || []).map(async (item) => {
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

    const map = new Map<string, Leader>()
    for (const r of itemsWithProfiles) {
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
        if (!existing.lastReturnedAt && r.returned_at) {
          existing.lastRecipient = recipient ?? existing.lastRecipient
          existing.lastReturnedAt = r.returned_at
        }
      }
    }

    const leaderboard = Array.from(map.values()).sort((a, b) => b.count - a.count)

    return NextResponse.json({ leaderboard })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
} 