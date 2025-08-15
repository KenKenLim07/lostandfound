"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/hooks/useSupabase"
import type { Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trash2, CheckCircle, Eye, Package, MapPin, Calendar, User, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at" | "returned_party">

export default function MyItemsPage() {
  const supabase = useSupabase()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [markReturnedDialog, setMarkReturnedDialog] = useState<{
    open: boolean
    item: Item | null
  }>({ open: false, item: null })
  const [returnedParty, setReturnedParty] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/")
          return
        }

        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at, returned_party")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        if (isMounted) {
          setItems(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load items")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [supabase, router])

  async function markAsReturned(item: Item) {
    if (!returnedParty.trim()) return

    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from("items")
        .update({
          status: "returned",
          returned_party: returnedParty.trim()
        })
        .eq("id", item.id)

      if (error) throw error

      // Update local state
      setItems(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: "returned" as const, returned_party: returnedParty.trim() }
          : i
      ))

      // Close dialog and reset form
      setMarkReturnedDialog({ open: false, item: null })
      setReturnedParty("")
      
      // Show success feedback (you could add a toast here)
      alert("Item marked as returned!")
    } catch (error) {
      console.error("Failed to mark as returned:", error)
      // You could add error toast here
      alert("Failed to mark item as returned.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteItem(item: Item) {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("id", item.id)

        if (error) throw error

        // Update local state
        setItems(prev => prev.filter(i => i.id !== item.id))
        alert("Item deleted!")
      } catch (error) {
        console.error("Failed to delete item:", error)
        // You could add error toast here
        alert("Failed to delete item.")
      }
    })
  }

  function formatRelativeTime(isoString: string | null | undefined): string {
    if (!isoString) return ""
    const now = Date.now()
    const then = new Date(isoString).getTime()
    const diffMs = Math.max(0, now - then)
    const sec = Math.floor(diffMs / 1000)
    if (sec < 5) return "just now"
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return min === 1 ? "1 min ago" : `${min} mins ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`
    const day = Math.floor(hr / 24)
    if (day < 7) return day === 1 ? "1 day ago" : `${day} days ago`
    const week = Math.floor(day / 7)
    return week === 1 ? "1 week ago" : `${week} weeks ago`
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">Failed to load items: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">My Reports</h1>
                <p className="text-sm text-muted-foreground">Manage your items</p>
              </div>
            </div>
            <Button asChild size="sm" className="text-xs sm:text-sm">
              <Link href="/post">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-6">Start helping others by posting your first item.</p>
                <Button asChild>
                  <Link href="/post">Report Your First Item</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={item.type === "lost" ? "destructive" : "default"}
                          className="text-white"
                        >
                          {item.type === "lost" ? "Lost" : "Found"}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground line-clamp-2">
                        {item.title || item.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title || item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      
                      {item.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{item.date}</span>
                      </div>

                      {item.status === "returned" && item.returned_party && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-700 font-medium">
                            {item.type === "lost" ? "Returned to" : "Returned by"}: {item.returned_party}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-w-[80px] flex-1 sm:flex-none text-xs sm:text-sm"
                      asChild
                    >
                      <Link href={`/items/${item.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    
                    {item.status !== "returned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-w-[120px] flex-1 sm:flex-none text-xs sm:text-sm"
                        onClick={() => setMarkReturnedDialog({ open: true, item })}
                        disabled={isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Returned
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteItem(item)}
                      disabled={isPending}
                      className="min-w-[60px] flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mark as Returned Dialog */}
      <Dialog 
        open={markReturnedDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setMarkReturnedDialog({ open: false, item: null })
            setReturnedParty("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Returned</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {markReturnedDialog.item?.type === "lost" 
                ? "Who was this item returned to?" 
                : "Who returned this item?"
              }
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returned-party">
                {markReturnedDialog.item?.type === "lost" ? "Returned to" : "Returned by"}
              </Label>
              <Input
                id="returned-party"
                value={returnedParty}
                onChange={(e) => setReturnedParty(e.target.value)}
                placeholder="Enter full name"
                className="h-10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && returnedParty.trim() && !isSubmitting) {
                    markReturnedDialog.item && markAsReturned(markReturnedDialog.item)
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMarkReturnedDialog({ open: false, item: null })}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => markReturnedDialog.item && markAsReturned(markReturnedDialog.item)}
                disabled={isSubmitting || !returnedParty.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  "Mark as Returned"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
} 