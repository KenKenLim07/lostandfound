"use client"

import { useState, useEffect, useMemo } from "react"
import type { Tables } from "@/types/database"
import { ItemCard } from "@/components/items/ItemCard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { ItemsSearchFilterBar } from "@/components/items/ItemsSearchFilterBar"
import { useRouter } from "next/navigation"
import { preloadItemImages } from "@/lib/imageCache"
import { AnimatedLink } from "@/components/ui/animated-link"
import { CampusGuardianDialog } from "@/components/leaderboard/CampusGuardianDialog"
import { PostingRulesDialog } from "@/components/posting/PostingRulesDialog"
import { useSupabase } from "@/hooks/useSupabase"
import { useToast } from "@/components/system/ToastProvider"
import { ErrorHandlers } from "@/lib/errorHandling"

const HOME_CACHE_KEY = "home_items_v1"
const HOME_CACHE_TTL_MS = 60_000

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at">

export default function PublicHomePage() {
  const supabase = useSupabase()
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "lost" | "found" | "returned">("all")

  // Login dialog control
  const [loginOpen, setLoginOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  // Hydrate from cache immediately to avoid flash when navigating back
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(HOME_CACHE_KEY) : null
      if (raw) {
        const cached = JSON.parse(raw) as { items: Item[]; ts: number }
        const isFresh = Date.now() - cached.ts < HOME_CACHE_TTL_MS
        if (isFresh && Array.isArray(cached.items)) {
          setItems(cached.items)
          if (cached.items.length > 0) {
            setIsLoading(false)
          }
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        const nextItems = data || []
        setItems(nextItems)

        try {
          sessionStorage.setItem(
            HOME_CACHE_KEY,
            JSON.stringify({ items: nextItems, ts: Date.now() })
          )
        } catch {}
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items")
      } finally {
        setIsLoading(false)
      }
    }
    fetchItems()
  }, [supabase])

  // Preload images to prevent blinking on navigation back
  useEffect(() => {
    if (items.length > 0) {
      preloadItemImages(items)
    }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesFilter = filter === "all" ||
        (filter === "lost" && item.type === "lost") ||
        (filter === "found" && item.type === "found") ||
        (filter === "returned" && item.status === "returned")

      return matchesSearch && matchesFilter
    })
  }, [items, searchTerm, filter])

  async function handleReportClick() {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Check if user is blocked before redirecting
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("blocked")
          .eq("id", data.session.user.id)
          .single()
        
        if (profileError) {
          console.error("Error checking user status:", profileError)
          setRulesOpen(true)
          return
        }
        
        if (profile?.blocked) {
          ErrorHandlers.permission(new Error("Account blocked"), toast)
          return
        }
        setRulesOpen(true)
      } else {
        try {
          sessionStorage.setItem("intent_after_login", "/post")
        } catch {}
        setLoginOpen(true)
      }
    } catch {
      try {
        sessionStorage.setItem("intent_after_login", "/post")
      } catch {}
      setLoginOpen(true)
    }
  }

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
      <section className="bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-2 sm:px-4 py-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, Mosquedian&apos;s
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse recently posted lost and found items.
            </p>
            <div className="flex flex-col gap-2 items-center">
              <CampusGuardianDialog />
              <Button onClick={handleReportClick} size="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Report Item
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth dialog (controlled) */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        showTrigger={false}
        initialMode="signin"
        note="Please sign in or create an account to report a lost or found item."
      />

      {/* Posting rules dialog */}
      <PostingRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        onContinue={() => router.push("/post")}
      />

      {/* Search and Filter Section */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <ItemsSearchFilterBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
      </section>

      {/* Items Grid Section */}
      <section className="container mx-auto px-2 sm:px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No items found.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredItems.length} items found
                </span>
              </div>
              <AnimatedLink href="/items" delay={1000} trigger={!isLoading}>
                View all items
              </AnimatedLink>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
              {filteredItems.slice(0, 6).map((item) => (
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
          </>
        )}
      </section>
    </main>
  )
} 