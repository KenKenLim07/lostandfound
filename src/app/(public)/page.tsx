"use client"
import { useState, useEffect, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/types/database"
import { ItemCard } from "@/components/items/ItemCard"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Search, Plus, Trophy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at">

export default function PublicHomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "lost" | "found" | "returned">("all")

  useEffect(() => {
    async function fetchItems() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error
        setItems(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Apply search filter
      const matchesSearch = !searchTerm || 
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.name.toLowerCase().includes(searchTerm.toLowerCase()))

      // Apply type/status filter
      const matchesFilter = filter === "all" ||
        (filter === "lost" && item.type === "lost") ||
        (filter === "found" && item.type === "found") ||
        (filter === "returned" && item.status === "returned")

      return matchesSearch && matchesFilter
    })
  }, [items, searchTerm, filter])

  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">Failed to load items: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-2 sm:px-4 py-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, Mosquedian&apos;s
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse recently posted lost and found items.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <Button asChild size="default" className="gap-2">
                <Link href="/post">
                  <Plus className="h-4 w-4" />
                  Report Item
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="gap-2">
                <Link href="/hall-of-fame">
                  <Trophy className="h-4 w-4" />
                  Hall of Fame
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="container mx-auto px-2 sm:px-4 py-2">
                  <div className="max-w-2xl mx-auto">

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items by title or name..."
                className="pl-10 h-10"
              />
            </div>
            <Select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full sm:w-[130px] h-10"
            >
              <option value="all">All Items</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="returned">Returned</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="container mx-auto px-0.5 sm:px-4 pb-2">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-2 sm:p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchTerm ? `No items matching &quot;${searchTerm}&quot;` : "No items have been posted yet."}
            </p>
            <Button asChild size="sm">
              <Link href="/post">Post the first item</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
              </h2>
              <div className="flex items-center gap-3">
                {searchTerm && (
                  <p className="text-xs text-muted-foreground">
                    Filtered by &quot;{searchTerm}&quot;
                  </p>
                )}
                <Link href="/items" className="text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide underline underline-offset-4 px-2">
                  View all items
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
              {filteredItems.map((item) => (
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
            </div>
          </div>
        )}
      </section>
    </main>
  )
} 