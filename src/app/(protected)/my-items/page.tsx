"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
// removed Separator
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { 
  Package, 
  Clock, 
  User, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  GraduationCap,
  Eye
} from "lucide-react"
import Link from "next/link"

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "status" | "image_url" | "created_at" | "returned_party" | "returned_year_section" | "returned_at">

export default function MyItemsPage() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [, setError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [activeFilter] = useState<"all" | "active" | "returned">("all")

  // Returned modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returningItemId, setReturningItemId] = useState<string | null>(null)
  const [returnedTo, setReturnedTo] = useState("")
  const [returnedYearSection, setReturnedYearSection] = useState("")
  const [returnedDate, setReturnedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [isSubmittingReturn, startSubmittingReturn] = useTransition()
  const [returningItemType, setReturningItemType] = useState<"lost" | "found" | null>(null)

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const session = data.session
      if (!session) {
        router.replace("/")
        return
      }
      setUserId(session.user.id)
      setIsLoadingUser(false)
    })
    return () => {
      isMounted = false
    }
  }, [supabase, router])

  useEffect(() => {
    if (!userId) return
    setIsFetching(true)
    setError(null)
    
    async function fetchItems() {
      if (!userId) return
      try {
        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, status, image_url, created_at, returned_party, returned_year_section, returned_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        
        if (error) setError(error.message ? error.message : "Failed to load items")
        setItems(data || [])
      } catch {
        setError("Failed to load items")
      } finally {
        setIsFetching(false)
      }
    }
    
    fetchItems()
  }, [supabase, userId])

  function openReturnModal(itemId: string) {
    setReturningItemId(itemId)
    const it = items.find(x => x.id === itemId)
    setReturningItemType((it?.type as "lost" | "found") ?? null)
    setReturnedTo("")
    setReturnedYearSection("")
    setReturnedDate(new Date().toISOString().slice(0, 10))
    setUseCustomDate(false)
    setReturnModalOpen(true)
  }

  function markAsReturned(e: React.FormEvent) {
    e.preventDefault()
    if (!returningItemId || !userId) return
    startSubmittingReturn(async () => {
      const updatePayload: Partial<Tables<"items">> = {
        status: "returned",
        returned_party: returnedTo || null,
        returned_year_section: returnedYearSection || null,
        returned_at: useCustomDate ? returnedDate : new Date().toISOString().slice(0, 10)
      }

      const { error } = await supabase
        .from("items")
        .update(updatePayload)
        .eq("id", returningItemId)
        .eq("user_id", userId)
      if (error) {
        alert(`Failed to mark as returned: ${error.message}`)
        return
      }
      setItems((prev) => prev.map((it) => 
        it.id === returningItemId 
          ? { ...it, status: "returned", returned_party: returnedTo || null, returned_year_section: returnedYearSection || null, returned_at: useCustomDate ? returnedDate : new Date().toISOString().slice(0, 10) }
          : it
      ))
      setReturnModalOpen(false)
    })
  }

  async function handleDelete(itemId: string, imageUrl: string | null) {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return
    setError(null)
    
    try {
      // Remove storage asset if present
      if (imageUrl) {
        const url = new URL(imageUrl)
        const prefix = "/storage/v1/object/public/items/"
        const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname.split("/items/")[1]
        if (path) {
          await supabase.storage.from("items").remove([path])
        }
      }

      const { error: delErr } = await supabase.from("items").delete().eq("id", itemId).eq("user_id", userId!)
      if (delErr) {
        setError(delErr.message)
        return
      }
      setItems((prev) => prev.filter((it) => it.id !== itemId))
    } catch {
      setError("Failed to delete item")
    }
  }

  const filteredItems = items.filter(item => {
    if (activeFilter === "active") return item.status !== "returned"
    if (activeFilter === "returned") return item.status === "returned"
    return true
  })

  // quick counts (optional) - commented out to avoid unused variable warning
  // const stats = { total: items.length, active: items.filter(i=>i.status!=="returned").length, returned: items.filter(i=>i.status==="returned").length }

  function formatDate(dateString: string | null) {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  function getStatusIcon(status: string | null) {
    if (status === "returned") return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-amber-600" />
  }

  function getStatusBadge(status: string | null) {
    if (status === "returned") {
      return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Returned</Badge>
    }
    return <Badge variant="outline">Active</Badge>
  }

  if (isLoadingUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-2">My Reports</h1>
          <p className="text-muted-foreground">Manage your lost and found reports.</p>
        </header>

        {/* Content */}
        {isFetching ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground mb-6">You haven&apos;t posted any reports yet.</p>
            <Button asChild>
              <Link href="/post">Create report now?</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isMock = item.image_url?.includes("your-bucket-url.supabase.co") ?? false
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {/* Image */}
                      <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted border">
                        {item.image_url ? (
                          <Image 
                            src={item.image_url} 
                            alt={item.title ?? item.name} 
                            fill 
                            className="object-cover" 
                            unoptimized={isMock}
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{item.title ?? item.name}</h3>
                            <p className="text-sm text-muted-foreground">Posted by {item.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>

                        {/* Return Info */}
                        {item.status === "returned" && (item.returned_party || item.returned_year_section || item.returned_at) && (
                          <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">Returned</span>
                            </div>
                            <div className="space-y-1 text-xs text-green-600">
                              {item.returned_party && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{item.type === "found" ? "To" : "By"}: {item.returned_party}</span>
                                </div>
                              )}
                              {item.returned_year_section && (
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  <span>{item.returned_year_section}</span>
                                </div>
                              )}
                              {item.returned_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Date: {formatDate(item.returned_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Posted Date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <Clock className="h-3 w-3" />
                          <span>Posted {formatDate(item.created_at)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => router.push(`/items/${item.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          
                          {item.status !== "returned" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openReturnModal(item.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Returned
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(item.id, item.image_url)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Mark Returned Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mark Item as Returned
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={markAsReturned} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returned_to">{returningItemType === "found" ? "Returned to (name) *" : "Returned by (name) *"}</Label>
              <Input 
                id="returned_to" 
                value={returnedTo} 
                onChange={(e) => setReturnedTo(e.target.value)} 
                placeholder={returningItemType === "found" ? "Owner's name" : "Student who returned the item"} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="returned_ys">Year & section (optional)</Label>
              <Input 
                id="returned_ys" 
                value={returnedYearSection} 
                onChange={(e) => setReturnedYearSection(e.target.value)} 
                placeholder="e.g., 3rd year – BSIT 3A" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  id="use_custom_date" 
                  type="checkbox" 
                  checked={useCustomDate} 
                  onChange={(e) => setUseCustomDate(e.target.checked)} 
                />
                <Label htmlFor="use_custom_date">Set custom date</Label>
              </div>
              {useCustomDate && (
                <div className="space-y-2">
                  <Label htmlFor="returned_at">Date returned</Label>
                  <Input 
                    id="returned_at" 
                    type="date" 
                    value={returnedDate} 
                    onChange={(e) => setReturnedDate(e.target.value)} 
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={isSubmittingReturn} className="flex-1">
                {isSubmittingReturn ? "Updating..." : "Confirm Return"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setReturnModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 