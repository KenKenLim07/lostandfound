"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { ItemsSearchFilterBar } from "@/components/items/ItemsSearchFilterBar"
import { useRouter } from "next/navigation"
import { AnimatedLink } from "@/components/ui/animated-link"
import { CampusGuardianDialog } from "@/components/leaderboard/CampusGuardianDialog"
import { PostingRulesDialog } from "@/components/posting/PostingRulesDialog"
import { useBackNav } from "@/hooks/useBackNav"

// Debug logging for home page
const DEBUG_HOME = true
function debugHome(message: string, data?: unknown) {
  if (DEBUG_HOME && typeof window !== 'undefined') {
    console.log(`🏠 [HomePage] ${message}`, data || '')
  }
}

const HOME_CACHE_KEY = "home_items_v1"
const HOME_CACHE_TTL_MS = 60_000

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at">

export default function PublicHomePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "lost" | "found" | "returned">("all")
  const { isBack, isMobile } = useBackNav()

  // Login dialog control
  const [loginOpen, setLoginOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  // Debug component lifecycle
  useEffect(() => {
    debugHome('HomePage mounted', { 
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isBack,
      isMobile,
    })
    
    return () => {
      debugHome('HomePage unmounted', { 
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }
  }, [isBack, isMobile])

  // Hydrate from cache immediately to avoid flash when navigating back
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(HOME_CACHE_KEY) : null
      debugHome('Hydrating from cache', { 
        hasCache: !!raw,
        cacheSize: raw ? JSON.parse(raw).items?.length : 0
      })
      
      if (raw) {
        const cached = JSON.parse(raw) as { items: Item[]; ts: number }
        const isFresh = Date.now() - cached.ts < HOME_CACHE_TTL_MS
        debugHome('Cache validation', { 
          isFresh, 
          ageMs: Date.now() - cached.ts,
          cacheSize: cached.items?.length
        })
        
        if (isFresh && Array.isArray(cached.items)) {
          setItems(cached.items)
          // Only set loading to false if we have items, otherwise keep loading
          if (cached.items.length > 0) {
            setIsLoading(false)
            debugHome('Cache hydration successful', { itemCount: cached.items.length })
          }
        }
      }
    } catch (error) {
      debugHome('Cache hydration error', error)
    }
  }, [])

  useEffect(() => {
    async function fetchItems() {
      try {
        debugHome('Fetching items from Supabase')
        const supabase = createClientComponentClient<Database>()
        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        const nextItems = data || []
        debugHome('Items fetched successfully', { 
          itemCount: nextItems.length,
          hasImages: nextItems.some(item => item.image_url)
        })
        
        setItems(nextItems)

        // Update cache
        try {
          sessionStorage.setItem(
            HOME_CACHE_KEY,
            JSON.stringify({ items: nextItems, ts: Date.now() })
          )
          debugHome('Cache updated', { itemCount: nextItems.length })
        } catch (cacheError) {
          debugHome('Cache update failed', cacheError)
        }
      } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        debugHome('Items fetch failed', err)
        // Handle error silently for better UX
      } finally {
        setIsLoading(false)
        debugHome('Loading state set to false')
      }
    }

    fetchItems()
  }, [])

  // Filter items based on search and filter
  const filteredItems = items.filter((item) => {
    const matchesSearch = searchTerm === "" || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filter === "all" || item.type === filter || 
      (filter === "returned" && item.status === "returned")

    return matchesSearch && matchesFilter
  })

  // Debug filtered items
  useEffect(() => {
    debugHome('Items filtered', { 
      totalItems: items.length,
      filteredItems: filteredItems.length,
      searchTerm,
      filter
    })
  }, [items, filteredItems, searchTerm, filter])

  async function handleReportClick() {
    try {
      const supabase = createClientComponentClient<Database>()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoginOpen(true)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("blocked")
        .eq("id", session.user.id)
        .single()

      if (profile?.blocked) {
        alert("Your account has been blocked. You cannot post new items.")
        return
      }

      setRulesOpen(true)
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setLoginOpen(true)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-2 sm:px-4 py-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome, Mosquedian&apos;s</h1>
            <p className="text-muted-foreground">Browse recently posted lost and found items.</p>
            <div className="flex flex-col gap-2 items-center">
              <CampusGuardianDialog />
              <Button onClick={handleReportClick} size="default" className="gap-2">
                <Plus className="h-4 w-4" /> Report Item
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="container mx-auto px-2 sm:px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} found`
              )}
            </h2>
            <div className="flex items-center gap-3">
              {searchTerm && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Search className="h-3 w-3" />
                  <span>&quot;{searchTerm}&quot;</span>
                </div>
              )}
              <AnimatedLink href="/items" delay={300} trigger={!isLoading}>
                View all items
              </AnimatedLink>
            </div>
          </div>
          <ItemsSearchFilterBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filter={filter}
            onFilterChange={(next) => setFilter(next)}
          />
          
          {/* Items Grid with Skeleton Loading */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
            {isLoading ? (
              // Show skeleton loading while fetching data
              Array.from({ length: 6 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))
            ) : filteredItems.length === 0 ? (
              // Show empty state when no items
              <div className="col-span-full text-center py-12">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No items found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              // Show actual items
              filteredItems.map((item) => (
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
                  preferNoFade={isBack && isMobile}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Dialogs */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} showTrigger={false} />
      <PostingRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        onContinue={() => { setRulesOpen(false); router.push("/post") }}
      />
    </main>
  )
}
