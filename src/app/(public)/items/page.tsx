"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { Search } from "lucide-react"

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

  return (
    <main className="container mx-auto px-2 sm:px-4 py-4">
      <header className="mb-3">
        <h1 className="text-xl font-semibold">All Items</h1>
        <p className="text-muted-foreground text-sm">Browse all posted lost and found items.</p>
      </header>

      <section className="mb-3 max-w-2xl">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items by title or name..."
              className="pl-10 h-10"
              aria-label="Search items"
            />
          </div>
          <Select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="w-full sm:w-[130px] h-10"
            aria-label="Filter items"
          >
            <option value="all">All Items</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="returned">Returned</option>
          </Select>
        </div>
      </section>

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
                <ItemCardSkeleton key={`more-${i}`} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  )
} 