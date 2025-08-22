"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { ItemsSearchFilterBar } from "@/components/items/ItemsSearchFilterBar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

type Item = Pick<Tables<"items">, "id" | "title" | "type" | "description" | "date" | "location" | "image_url" | "status" | "created_at" | "user_id"> & {
  profile?: {
    full_name: string | null
    school_id: string | null
    year_section: string | null
    contact_number: string | null
  } | null
}

const PAGE_SIZE = 24

export default function AllItemsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // Read query params once on mount
  useEffect(() => {
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    if (type === "lost" || type === "found") {
      setFilter(type)
    } else if (status === "returned") {
      setFilter("returned")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Always start at the top when entering this page
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    }
  }, [])

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
      .select("id, title, type, description, date, location, image_url, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)

    if (like) {
      query = query.or(`title.ilike.${like},description.ilike.${like}`)
    }

    if (filter === "lost" || filter === "found") {
      query = query.eq("type", filter)
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

    const itemsWithProfiles: Item[] = await Promise.all(
      (data || []).map(async (item) => {
        if (item.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, school_id, year_section, contact_number")
            .eq("id", item.user_id)
            .single()
          return { ...item, profile: profile || undefined }
        }
        return { ...item, profile: undefined }
      })
    )

    setHasMore((itemsWithProfiles?.length ?? 0) === PAGE_SIZE)

    if (append) {
      setItems((prev) => [...prev, ...itemsWithProfiles])
    } else {
      setItems(itemsWithProfiles)
    }

    const last = itemsWithProfiles[itemsWithProfiles.length - 1]
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

  const heading = useMemo(() => {
    if (filter === "lost") return "Lost Items"
    if (filter === "found") return "Found Items"
    if (filter === "returned") return "Returned Items"
    return "All Items"
  }, [filter])

  return (
    <main className="container mx-auto px-0.5 sm:px-4 py-4">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
        <h1 className="text-xl font-semibold">{heading}</h1>
        <p className="text-muted-foreground text-sm">Browse all posted lost and found items.</p>
          </div>
        </div>
      </header>

      <section className="mb-3 max-w-2xl">
        <ItemsSearchFilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filter={filter}
          onFilterChange={(next) => setFilter(next)}
        />
      </section>

      {isLoading ? (
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1" aria-busy>
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
          <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                name={item.profile?.full_name || "Unknown User"}
                type={item.type as "lost" | "found"}
                description={item.description}
                date={item.date}
                location={item.location}
                contactNumber={item.profile?.contact_number || null}
                imageUrl={item.image_url}
                status={item.status as "active" | "returned" | null}
                createdAt={item.created_at}
                href={`/items/${item.id}?from=items`}
              />
            ))}
          </section>

          {/* Load more sentinel */}
          <div ref={observerRef} aria-hidden className="h-10" />

          {/* Accessible Load more button fallback */}
          {hasMore && !isLoadingMore && (
            <div className="mt-3 flex justify-center">
              <button className="btn" onClick={() => {
                setIsLoadingMore(true)
                fetchPage({ append: true, cursor })
                  .catch(() => {})
                  .finally(() => setIsLoadingMore(false))
              }}>Load more</button>
            </div>
          )}

          {/* Loading more skeletons */}
          {isLoadingMore && (
            <section className="mt-3 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1" aria-busy>
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