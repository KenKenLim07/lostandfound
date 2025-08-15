"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { ItemsSearchFilterBar } from "@/components/items/ItemsSearchFilterBar"

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at">

const PAGE_SIZE = 24

export default function AllItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "lost" | "found" | "returned">("all")
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null)

  const observerRef = useRef<HTMLDivElement | null>(null)
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient<Database>(url, key)
  }, [])

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250)
    return () => clearTimeout(t)
  }, [searchTerm])

  async function fetchPage(opts: { append: boolean; cursor?: { created_at: string; id: string } | null }) {
    const { append, cursor } = opts
    const like = debouncedSearch ? `%${debouncedSearch}%` : null

    let query = supabase
      .from("items")
      .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)

    if (like) {
      query = query.or(`title.ilike.${like},name.ilike.${like}`)
    }

    if (filter === "lost" || filter === "found") {
      query = query.eq("type", filter)
    } else if (filter === "returned") {
      query = query.eq("status", "returned")
    }

    if (cursor) {
      // Keyset pagination: created_at < cursor.created_at OR (created_at = cursor.created_at AND id < cursor.id)
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
  }

  // Initial fetch and on filter/search change
  useEffect(() => {
    setIsLoading(true)
    setCursor(null)
    fetchPage({ append: false, cursor: null })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [debouncedSearch, filter, supabase])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true)
          fetchPage({ append: true, cursor })
            .catch(() => {})
            .finally(() => setIsLoadingMore(false))
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, cursor, supabase])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              ) : (
                "All Items"
              )}
            </h1>
          </div>
          <ItemsSearchFilterBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filter={filter}
            onFilterChange={(next) => setFilter(next)}
          />
          {isLoading ? (
            <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1" aria-busy>
              {Array.from({ length: 12 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </section>
          ) : items.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No items found.</p>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    name={item.name}
                    type={item.type as "lost" | "found"}
                    description={item.description}
                    date={item.date}
                    location={item.location}
                    contactNumber={item.contact_number}
                    imageUrl={item.image_url}
                    status={item.status as "active" | "returned" | null}
                    createdAt={item.created_at}
                    href={`/items/${item.id}`}
                  />
                ))}
              </section>

              {/* Load more sentinel */}
              <div ref={observerRef} aria-hidden className="h-10" />

              {/* Accessible Load more button fallback */}
              {hasMore && !isLoadingMore && (
                <div className="mt-3 flex justify-center">
                  <Button onClick={() => {
                    setIsLoadingMore(true)
                    fetchPage({ append: true, cursor })
                      .catch(() => {})
                      .finally(() => setIsLoadingMore(false))
                  }}>Load more</Button>
                </div>
              )}

              {/* Loading more skeletons */}
              {isLoadingMore && (
                <section className="mt-3 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1" aria-busy>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ItemCardSkeleton key={i} />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
