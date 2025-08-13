"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { PromoteDemoteButton } from "./UsersRoleButton"

export default function UsersPanel() {
  const supabase = createClientComponentClient<Database>()
  const [data, setData] = useState<Array<Pick<Tables<"profiles">, "id" | "full_name" | "role">>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: users, error } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .order("created_at", { ascending: false })
          .limit(100)

        if (error) throw error
        setData(users ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load users: {error}</div>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr className="text-left">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td className="px-3 py-4 text-muted-foreground" colSpan={3}>No users found.</td></tr>
          ) : (
            data.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.full_name ?? u.id}</td>
                <td className="px-3 py-2 capitalize">{u.role ?? "user"}</td>
                <td className="px-3 py-2">
                  <PromoteDemoteButton userId={u.id} currentRole={u.role ?? "user"} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
} 