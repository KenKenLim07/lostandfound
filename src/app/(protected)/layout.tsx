import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
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
    .select("blocked")
    .eq("id", session.user.id)
    .single()

  if (profile?.blocked) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {children}
    </div>
  )
} 