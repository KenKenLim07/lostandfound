import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, blocked")
    .eq("id", session.user.id)
    .single()

  if (!profile || profile.role !== "admin" || profile.blocked) {
    redirect("/")
  }

  return <>{children}</>
} 