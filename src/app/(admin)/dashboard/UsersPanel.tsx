"use client"

import { useEffect, useState } from "react"
import type { Tables } from "@/types/database"
import { PromoteDemoteButton } from "./UsersRoleButton"
import { UsersBlockButton } from "./UsersBlockButton"
import { getAllUsers } from "./actions"

export default function UsersPanel() {
  const [data, setData] = useState<Array<Pick<Tables<"profiles">, "id" | "full_name" | "role" | "blocked">>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const users = await getAllUsers()
        setData(users ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load users: {error}</div>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted">
          <tr className="text-left">
            <th className="px-3 py-2 border-r border-border/50">Name</th>
            <th className="px-3 py-2 border-r border-border/50">Role</th>
            <th className="px-3 py-2 border-r border-border/50">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td className="px-3 py-4 text-muted-foreground border-r border-border/50" colSpan={4}>No users found.</td></tr>
          ) : (
            data.map((u) => (
              <tr key={u.id} className="border-t border-border/50">
                <td className="px-3 py-2 border-r border-border/50">{u.full_name ?? u.id}</td>
                <td className="px-3 py-2 capitalize border-r border-border/50">{u.role ?? "user"}</td>
                <td className="px-3 py-2 border-r border-border/50">
                  {u.blocked ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 border-l border-border/50">
                  <div className="flex items-center gap-3 h-full">
                  <PromoteDemoteButton userId={u.id} currentRole={u.role ?? "user"} />
                    <UsersBlockButton userId={u.id} isBlocked={u.blocked ?? false} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
} 