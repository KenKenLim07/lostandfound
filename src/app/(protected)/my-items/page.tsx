"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/hooks/useSupabase"
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates"
import type { Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trash2, CheckCircle, Eye, Package, MapPin, Calendar, User, ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

type Item = Pick<Tables<"items">, "id" | "title" | "type" | "description" | "date" | "location" | "image_url" | "status" | "created_at" | "returned_party" | "returned_year_section" | "returned_at">

type ProfileSuggestion = {
  name: string
  year_section: string | null
}

type EditableItemFields = Pick<Tables<"items">, "title" | "description" | "date" | "location" | "type"> & { id: string }

export default function MyItemsPage() {
  const supabase = useSupabase()
  const router = useRouter()
  const { notifyItemStatusChange, invalidateCaches } = useRealTimeUpdates()
  
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Dialog states
  const [returnDialog, setReturnDialog] = useState<{
    open: boolean
    item: Item | null
  }>({ open: false, item: null })
  const [returnedParty, setReturnedParty] = useState("")
  const [returnedYearSection, setReturnedYearSection] = useState("")
  const [returnedDate, setReturnedDate] = useState("")

  // Suggestions state
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([])
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Edit Dialog states
  const [editDialog, setEditDialog] = useState<{ open: boolean; item: EditableItemFields | null }>({ open: false, item: null })
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editLocation, setEditLocation] = useState("")

  // Show success message and clear it after 3 seconds
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Reset return dialog form
  const resetReturnDialog = () => {
    setReturnedParty("")
    setReturnedYearSection("")
    setReturnedDate(new Date().toISOString().split('T')[0]) // Default to today
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Open return dialog with default values
  const openReturnDialog = (item: Item) => {
    setReturnedDate(new Date().toISOString().split('T')[0]) // Default to today
    setReturnedParty("")
    setReturnedYearSection("")
    setReturnDialog({ open: true, item })
    setShowSuggestions(true)
  }

  function openEditDialog(item: Item) {
    setEditDialog({ open: true, item: { id: item.id, title: item.title || "", description: item.description || "", date: item.date || "", location: item.location || "", type: item.type } })
    setEditTitle(item.title || "")
    setEditDescription(item.description || "")
    setEditDate(item.date || "")
    setEditLocation(item.location || "")
  }

  function resetEditDialog() {
    setEditDialog({ open: false, item: null })
    setEditTitle("")
    setEditDescription("")
    setEditDate("")
    setEditLocation("")
  }

  async function saveEdits() {
    if (!editDialog.item) return
    const id = editDialog.item.id
    const trimmedTitle = editTitle.trim()
    const trimmedDesc = editDescription.trim()
    const trimmedLoc = editLocation.trim()

    const payload: Partial<Tables<"items">> = {
      title: trimmedTitle === "" ? null : trimmedTitle,
      description: trimmedDesc === "" ? null : trimmedDesc,
      // Only send date if provided; otherwise leave unchanged
      date: editDate !== "" ? editDate : undefined,
      location: trimmedLoc === "" ? null : trimmedLoc,
    }

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", id)
        if (error) throw error

        // update local state without introducing incompatible nulls for non-nullable fields
        setItems(prev => prev.map(i => {
          if (i.id !== id) return i
          return {
            ...i,
            title: trimmedTitle === "" ? i.title : trimmedTitle,
            description: trimmedDesc === "" ? i.description : trimmedDesc,
            date: editDate === "" ? i.date : editDate,
            location: trimmedLoc === "" ? i.location : trimmedLoc,
          }
        }))
        setSuccessMessage("Post updated successfully")
        resetEditDialog()
      } catch (err) {
        console.error("Failed to update item:", err)
        alert(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    })
  }

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/")
          return
        }
        setCurrentUserId(user.id)

        const { data, error } = await supabase
          .from("items")
          .select("id, title, type, description, date, location, image_url, status, created_at, returned_party, returned_year_section, returned_at")
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

  // Seed suggestions with recent names used by the current user when dialog opens
  useEffect(() => {
    if (!returnDialog.open || !currentUserId) return
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("items")
          .select("returned_party, returned_year_section")
          .eq("user_id", currentUserId)
          .not("returned_party", "is", null)
          .order("returned_at", { ascending: false })
          .limit(12)
        if (error) throw error

        const unique: Record<string, ProfileSuggestion> = {}
        for (const row of data || []) {
          const key = (row.returned_party || "").trim().toLowerCase()
          if (!key) continue
          if (!unique[key]) {
            unique[key] = { name: row.returned_party as string, year_section: (row.returned_year_section as string) || null }
          }
        }
        if (!cancelled) {
          setSuggestions(Object.values(unique).slice(0, 8))
        }
      } catch {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [returnDialog.open, currentUserId, supabase])

  // Debounced server-side search for names: try API (profiles via service role), fallback to items.returned_party
  useEffect(() => {
    if (!returnDialog.open) return
    const term = returnedParty.trim()
    if (term.length < 2) return
    let cancelled = false
    setIsFetchingSuggestions(true)

    const t = setTimeout(async () => {
      try {
        // Try server API first
        const apiRes = await fetch(`/api/suggest-names?q=${encodeURIComponent(term)}`)
        if (apiRes.ok) {
          const json = await apiRes.json() as { suggestions: ProfileSuggestion[] }
          if (!cancelled && json.suggestions && json.suggestions.length > 0) {
            setSuggestions(json.suggestions.slice(0, 8))
            setIsFetchingSuggestions(false)
            return
          }
        }
      } catch {
        // ignore and fallback
      }

      // Fallback to client Supabase search on items.returned_party (RLS-friendly)
      try {
        const { data, error } = await supabase
          .from("items")
          .select("returned_party, returned_year_section, returned_at")
          .not("returned_party", "is", null)
          .ilike("returned_party", `%${term}%`)
          .order("returned_at", { ascending: false })
          .limit(24)
        if (error) throw error
        if (!cancelled) {
          const unique: Record<string, ProfileSuggestion> = {}
          for (const row of data || []) {
            const key = (row.returned_party as string | null)?.trim().toLowerCase()
            if (!key) continue
            if (!unique[key]) {
              unique[key] = { name: row.returned_party as string, year_section: (row.returned_year_section as string) || null }
            }
          }
          setSuggestions(Object.values(unique).slice(0, 8))
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsFetchingSuggestions(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [returnedParty, supabase, returnDialog.open])

  async function markAsReturned(item: Item) {
    if (!returnedParty.trim()) return

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("items")
          .update({
            status: "returned",
            returned_party: returnedParty.trim(),
            returned_year_section: returnedYearSection.trim() || null,
            returned_at: returnedDate || new Date().toISOString()
          })
          .eq("id", item.id)

        if (error) throw error

        // Update local state
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                status: "returned" as const, 
                returned_party: returnedParty.trim(),
                returned_year_section: returnedYearSection.trim() || null,
                returned_at: returnedDate || new Date().toISOString()
              }
            : i
        ))

        // Notify other components and invalidate caches
        notifyItemStatusChange(item.id, "returned")
        invalidateCaches()

        setReturnDialog({ open: false, item: null })
        resetReturnDialog()
        showSuccessMessage("Item marked as returned successfully")
      } catch (error) {
        console.error("Failed to mark as returned:", error)
        alert(`Failed to mark as returned: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    })
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
        
        // Notify other components and invalidate caches
        notifyItemStatusChange(item.id, "deleted")
        invalidateCaches()
        
        showSuccessMessage("Item deleted successfully")
      } catch (error) {
        console.error("Failed to delete item:", error)
        alert(`Failed to delete item: ${error instanceof Error ? error.message : "Unknown error"}`)
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
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
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
              <p className="text-sm text-muted-foreground hidden sm:block">Manage your lost and found items</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                <div className="flex gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex-shrink-0" />
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
          <div className="text-center py-16 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No reports yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start helping others by posting your first lost or found item.
            </p>
            <Button asChild size="lg">
              <Link href="/post">Post Your First Item</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden border">
                {/* Item Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={item.type === "lost" ? "destructive" : "default"}
                          className={cn(
                            "text-xs",
                            item.type === "lost" ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
                          )}
                        >
                          {item.type === "lost" ? "Lost" : "Found"}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground line-clamp-2 text-base">
                        {item.title || "Untitled Item"}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        Posted {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {/* Item Content */}
                <CardContent className="pt-0">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title || "Item image"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">You</span>
                      </div>
                      
                      {item.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>{item.date}</span>
                      </div>

                      {item.status === "returned" && item.returned_party && (
                        <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span className="text-green-700 font-medium text-xs">
                            {item.type === "lost" ? "Returned to" : "Returned by"}: {item.returned_party}
                          </span>
                          </div>
                          {item.returned_year_section && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground text-xs ml-5">
                                {item.returned_year_section}
                              </span>
                            </div>
                          )}
                          {item.returned_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground text-xs ml-5">
                                {new Date(item.returned_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      asChild
                    >
                      <Link href={`/items/${item.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => openEditDialog(item)}
                      disabled={isPending}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    {item.status !== "returned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={() => openReturnDialog(item)}
                        disabled={isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Returned
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteItem(item)}
                      disabled={isPending}
                      className="flex-shrink-0 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
        open={returnDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setReturnDialog({ open: false, item: null })
            resetReturnDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Returned</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {returnDialog.item?.type === "lost" 
                ? "Who returned this item to you?" 
                : "Who did you return this item to?"
              }
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Returned Party */}
            <div className="grid gap-2">
              <Label htmlFor="returned-party">
                {returnDialog.item?.type === "lost" ? "Returned by" : "Returned to"}
              </Label>
              <div className="relative">
              <Input
                id="returned-party"
                value={returnedParty}
                  onChange={(e) => {
                    setReturnedParty(e.target.value)
                    setShowSuggestions(true)
                  }}
                placeholder="Enter full name"
                className="h-10"
                autoFocus
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && returnedParty.trim() && returnDialog.item) {
                    markAsReturned(returnDialog.item)
                  }
                }}
              />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow max-h-48 overflow-auto">
                    <div className="py-1 text-xs text-muted-foreground px-2 sticky top-0 bg-popover/90 backdrop-blur">
                      Suggestions{isFetchingSuggestions ? " (searching...)" : ""}
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={`${s.name}-${idx}`}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setReturnedParty(s.name)
                          setReturnedYearSection(s.year_section || "")
                          setShowSuggestions(false)
                        }}
                      >
                        <div className="font-medium text-sm">{s.name}</div>
                        {s.year_section && (
                          <div className="text-xs text-muted-foreground">{s.year_section}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Year and Section */}
            <div className="grid gap-2">
              <Label htmlFor="returned-year-section">
                Course Year & Section (Optional)
              </Label>
              <Input
                id="returned-year-section"
                value={returnedYearSection}
                onChange={(e) => setReturnedYearSection(e.target.value)}
                placeholder="e.g., 2nd Year BSIT-A, 1st Year BSCS-B"
                className="h-10"
              />
            </div>

            {/* Return Date */}
            <div className="grid gap-2">
              <Label htmlFor="returned-date">
                Return Date
              </Label>
              <Input
                id="returned-date"
                type="date"
                value={returnedDate}
                onChange={(e) => setReturnedDate(e.target.value)}
                className="h-10"
                max={new Date().toISOString().split('T')[0]} // Can't be in the future
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setReturnDialog({ open: false, item: null })
                  resetReturnDialog()
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => returnDialog.item && markAsReturned(returnDialog.item)}
                disabled={isPending || !returnedParty.trim()}
              >
                {isPending ? "Saving..." : "Mark Returned"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetEditDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-10" placeholder="Enter a short descriptive title" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Add details that help identify or describe the item" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date {editDialog.item?.type === "lost" ? "Lost" : "Found"}</Label>
              <Input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="h-10" placeholder="Where was it lost/found?" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetEditDialog} disabled={isPending}>Cancel</Button>
              <Button type="button" onClick={saveEdits} disabled={isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
} 