"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  Eye,
  Search
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/system/ToastProvider"
import { ErrorHandlers } from "@/lib/errorHandling"

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "status" | "image_url" | "created_at" | "returned_party" | "returned_year_section" | "returned_at">

const PAGE_SIZE = 20

export default function ItemsTable() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "returned">("all")
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null)

  const observerRef = useRef<HTMLDivElement | null>(null)

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250)
    return () => clearTimeout(t)
  }, [searchTerm])

  const fetchPage = useCallback(async (opts: { append: boolean; cursor?: { created_at: string; id: string } | null }) => {
    const { append, cursor } = opts
    const like = debouncedSearch ? `%${debouncedSearch}%` : null

    let query = supabase
      .from("items")
      .select("id, title, name, type, status, image_url, created_at, returned_party, returned_year_section, returned_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)

    if (like) {
      query = query.or(`title.ilike.${like},name.ilike.${like}`)
    }

    if (filter === "active") {
      query = query.eq("status", "active")
    } else if (filter === "returned") {
      query = query.eq("status", "returned")
    }

    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      )
    }

    const { data, error } = await query
    if (error) throw error

    setHasMore((data?.length ?? 0) === PAGE_SIZE)

    if (append) {
      setItems((prev) => [...prev, ...(data || [])])
    } else {
      setItems(data || [])
    }

    const last = (data || [])[data.length - 1]
    setCursor(last ? { created_at: last.created_at!, id: last.id } : null)
  }, [debouncedSearch, filter, supabase])

  // Initial fetch and on filter/search change
  useEffect(() => {
    setIsLoading(true)
    setCursor(null)
    fetchPage({ append: false, cursor: null })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [debouncedSearch, filter, supabase, fetchPage])

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current) return
    const el = observerRef.current
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
        setIsLoadingMore(true)
        fetchPage({ append: true, cursor })
          .catch(() => {})
          .finally(() => setIsLoadingMore(false))
      }
    }, { rootMargin: "200px" })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, isLoading, isLoadingMore, cursor, debouncedSearch, filter, fetchPage])

  async function markAsReturned(itemId: string) {
    try {
      const { error } = await supabase
        .from("items")
        .update({ status: "returned" })
        .eq("id", itemId)

      if (error) throw error

      // Update local state
      setItems((prev) => prev.map((item) => 
        item.id === itemId 
          ? { ...item, status: "returned" as const }
          : item
      ))
    } catch (e) {
      ErrorHandlers.itemOperation("update", e, toast)
    }
  }

  async function deleteItem(itemId: string, imageUrl: string | null) {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

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

      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId)

      if (error) throw error

      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (e) {
      ErrorHandlers.itemOperation("delete", e, toast)
    }
  }

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

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search items</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="filter" className="sr-only">Filter by status</Label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "active" | "returned")}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">All Items</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? `No items matching "${searchTerm}"` : "No items have been posted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline" 
                          onClick={() => router.push(`/items/${item.id}`)}
                          className="w-full sm:w-auto"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        {item.status !== "returned" && (
                          <Button
                            size="sm"
                            variant="outline" 
                            onClick={() => markAsReturned(item.id)}
                            className="w-full sm:w-auto"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Returned
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteItem(item.id, item.image_url)}
                          className="w-full sm:w-auto"
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

          {/* Load more sentinel */}
          <div ref={observerRef} aria-hidden className="h-10" />

          {/* Loading more skeletons */}
          {isLoadingMore && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={`more-${i}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 