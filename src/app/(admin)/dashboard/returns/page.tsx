import { createServerSupabaseClient } from "@/lib/supabase-server"
import { AdminReturnsList } from "../AdminReturnsList"

export const dynamic = "force-dynamic"

export default async function AdminReturnsPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, blocked")
    .eq("id", session.user.id)
    .single()

  if (!profile || profile.role !== "admin" || profile.blocked) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Returns Management</h1>
        <p className="text-muted-foreground">View and manage returned items.</p>
      </div>
      <AdminReturnsList />
    </div>
  )
} 