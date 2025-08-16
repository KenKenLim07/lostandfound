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

type RecentItem = {
  id: string
  title: string | null
  type: string
  status: string | null
  created_at: string | null
  returned_party?: string | null
  returned_at?: string | null
  user_id: string | null
  profile?: {
    full_name: string | null
    school_id: string | null
    year_section: string | null
  }
}

export default function AdminOverview() {
  const supabase = useSupabase()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalItems: 0,
    returnedItems: 0,
    activeItems: 0
  })
  const [recentPosts, setRecentPosts] = useState<RecentItem[]>([])
  const [recentReturns, setRecentReturns] = useState<RecentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [
          { count: totalUsers }, 
          { count: totalItems }, 
          { count: returnedItems }, 
          { count: activeItems },
          { data: recentPostsData },
          { data: recentReturnsData }
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "returned"),
          supabase.from("items").select("id", { count: "exact", head: true }).neq("status", "returned"),
          supabase.from("items").select("id, title, type, status, created_at, user_id").order("created_at", { ascending: false }).limit(5),
          supabase.from("items").select("id, title, type, status, created_at, returned_party, returned_at, user_id").eq("status", "returned").order("returned_at", { ascending: false }).limit(5)
        ])

        // Fetch profile data for recent posts
        const recentPostsWithProfiles: RecentItem[] = await Promise.all(
          (recentPostsData || []).map(async (item) => {
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

        // Fetch profile data for recent returns
        const recentReturnsWithProfiles: RecentItem[] = await Promise.all(
          (recentReturnsData || []).map(async (item) => {
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

        setStats({
          totalUsers: totalUsers ?? 0,
          totalItems: totalItems ?? 0,
          returnedItems: returnedItems ?? 0,
          activeItems: activeItems ?? 0,
        })
        
        setRecentPosts(recentPostsWithProfiles)
        setRecentReturns(recentReturnsWithProfiles)
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Listen for item status changes to refresh data
  useEffect(() => {
    const handleItemStatusChange = async () => {
      setIsLoading(true)
      try {
        const [
          { count: totalUsers }, 
          { count: totalItems }, 
          { count: returnedItems }, 
          { count: activeItems },
          { data: recentPostsData },
          { data: recentReturnsData }
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }),
          supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "returned"),
          supabase.from("items").select("id", { count: "exact", head: true }).neq("status", "returned"),
          supabase.from("items").select("id, title, type, status, created_at, user_id").order("created_at", { ascending: false }).limit(5),
          supabase.from("items").select("id, title, type, status, created_at, returned_party, returned_at, user_id").eq("status", "returned").order("returned_at", { ascending: false }).limit(5)
        ])

        // Fetch profile data for recent posts
        const recentPostsWithProfiles: RecentItem[] = await Promise.all(
          (recentPostsData || []).map(async (item) => {
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

        // Fetch profile data for recent returns
        const recentReturnsWithProfiles: RecentItem[] = await Promise.all(
          (recentReturnsData || []).map(async (item) => {
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

        setStats({
          totalUsers: totalUsers ?? 0,
          totalItems: totalItems ?? 0,
          returnedItems: returnedItems ?? 0,
          activeItems: activeItems ?? 0,
        })
        
        setRecentPosts(recentPostsWithProfiles)
        setRecentReturns(recentReturnsWithProfiles)
      } catch (error) {
        console.error("Error refreshing stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    window.addEventListener("itemStatusChanged", handleItemStatusChange)
    return () => window.removeEventListener("itemStatusChanged", handleItemStatusChange)
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
            {recentReturns.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No recent returns</div>
            ) : (
              recentReturns.map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.title || item.profile?.full_name || "Unknown Item"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Returned to {item.returned_party || "Unknown"} • {item.type}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2">
                      {item.returned_at ? new Date(item.returned_at).toLocaleDateString() : "Unknown date"}
                  </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Posts</h2>
          <div className="rounded-md border divide-y">
            {recentPosts.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No recent posts</div>
            ) : (
              recentPosts.map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.title || item.profile?.full_name || "Unknown Item"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Posted by {item.profile?.full_name || "Unknown User"} • {item.type} • {item.status}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown date"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
} 