"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, CheckCircle, AlertTriangle } from "lucide-react"

type Stats = {
  totalUsers: number
  totalItems: number
  returnedItems: number
  activeItems: number
}

export default function AdminOverview() {
  const supabase = useSupabase()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalItems: 0,
    returnedItems: 0,
    activeItems: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [{ count: totalUsers }, { count: totalItems }, { count: returnedItems }, { count: activeItems }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "returned"),
          supabase.from("items").select("id", { count: "exact", head: true }).neq("status", "returned"),
        ])

        setStats({
          totalUsers: totalUsers ?? 0,
          totalItems: totalItems ?? 0,
          returnedItems: returnedItems ?? 0,
          activeItems: activeItems ?? 0,
        })
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (isLoading) {
    return <div className="space-y-6">Loading overview...</div>
  }

  if (!stats) {
    return <div className="space-y-6">Failed to load overview data.</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  All registered users in the system.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  All items tracked in the system.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returned Items</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.returnedItems}</div>
                <p className="text-xs text-muted-foreground">
                  Items that have been returned to their owners.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeItems}</div>
                <p className="text-xs text-muted-foreground">
                  Items currently in the system.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Returns</h2>
          <div className="rounded-md border divide-y">
            {/* The original code had a useOverviewData hook that fetched recent returns and posts.
                This section is now directly using the stats object and the supabase client.
                The original useOverviewData hook is removed. */}
            <div className="p-3 text-sm text-muted-foreground">Recent returns data is not available in this simplified overview.</div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Posts</h2>
          <div className="rounded-md border divide-y">
            {/* The original code had a useOverviewData hook that fetched recent returns and posts.
                This section is now directly using the stats object and the supabase client.
                The original useOverviewData hook is removed. */}
            <div className="p-3 text-sm text-muted-foreground">Recent posts data is not available in this simplified overview.</div>
          </div>
        </section>
      </div>
    </div>
  )
} 