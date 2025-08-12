import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { AdminNav } from "./AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()
  if (profile?.role !== "admin") redirect("/")

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground">Dashboard</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-md border p-3 h-max sticky top-20">
          <AdminNav />
        </aside>
        <section>{children}</section>
      </div>
    </div>
  )
} 