"use client"
import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { ItemCard } from "@/components/items/ItemCard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Trophy, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { ItemsSearchFilterBar } from "@/components/items/ItemsSearchFilterBar"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { heroAnimations, cardAnimations, getReducedMotionVariants, shouldAnimateOnMount, markAsAnimated, getInitialAnimationState, getInitialAnimationStateSimple, markNavigationTime } from "@/lib/animations"
import { useReducedMotion } from "framer-motion"
import { AnimatedLink } from "@/components/ui/animated-link"
import { CampusGuardianDialog } from "@/components/leaderboard/CampusGuardianDialog"
import { PostingRulesDialog } from "@/components/posting/PostingRulesDialog"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"

const HOME_CACHE_KEY = "home_items_v1"
const HOME_CACHE_TTL_MS = 60_000

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at">

export default function PublicHomePage() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "lost" | "found" | "returned">("all")

  // Login dialog control
  const [loginOpen, setLoginOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  // Animation support
  const shouldReduceMotion = useReducedMotion()
  const [useSimpleApproach, setUseSimpleApproach] = useState(true)

  // Hydrate from cache immediately to avoid flash when navigating back
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(HOME_CACHE_KEY) : null
      if (raw) {
        const cached = JSON.parse(raw) as { items: Item[]; ts: number }
        const isFresh = Date.now() - cached.ts < HOME_CACHE_TTL_MS
        if (isFresh && Array.isArray(cached.items)) {
          setItems(cached.items)
          // Only set loading to false if we have items, otherwise keep loading
          if (cached.items.length > 0) {
            setIsLoading(false)
          }
        }
      }
    } catch {
      // ignore cache errors
    }
  }, [])

  useEffect(() => {
    async function fetchItems() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClientComponentClient<Database>()

        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        const nextItems = data || []
        setItems(nextItems)
        setHasAttemptedFetch(true)

        // Update cache
        try {
          sessionStorage.setItem(
            HOME_CACHE_KEY,
            JSON.stringify({ items: nextItems, ts: Date.now() })
          )
        } catch {
          // ignore cache write errors
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Track navigation time for animation state management
  useEffect(() => {
    markNavigationTime('home-page')
  }, [])

  // Debug state for development
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const info = {
        hasAnimated: sessionStorage.getItem('animated_home-page'),
        navTime: sessionStorage.getItem('nav_home-page'),
        hotReloadTime: sessionStorage.getItem('hot_reload_home-page'),
        currentTime: Date.now(),
        shouldAnimate: shouldAnimateOnMount('home-page'),
        initialState: getInitialAnimationState('home-page'),
        initialStateSimple: getInitialAnimationStateSimple('home-page'),
        useSimpleApproach
      }
      setDebugInfo(info)
    }
  }, [useSimpleApproach])


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
          // If we can't check, allow the user to proceed (fail open)
          setRulesOpen(true)
          return
        }
        
        if (profile?.blocked) {
          // Show blocked message instead of redirecting
          alert("Your account has been blocked. You cannot post new items. Please contact an administrator if you believe this is an error.")
          return
        }
        
        // User is not blocked, show rules dialog first
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
      {/* Debug Panel - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
          <div className="font-bold mb-2">🐛 Debug Info</div>
          <div>hasAnimated: {debugInfo.hasAnimated || 'null'}</div>
          <div>navTime: {debugInfo.navTime || 'null'}</div>
          <div>hotReloadTime: {debugInfo.hotReloadTime || 'null'}</div>
          <div>currentTime: {debugInfo.currentTime}</div>
          <div>shouldAnimate: {String(debugInfo.shouldAnimate)}</div>
          <div>initialState: {debugInfo.initialState}</div>
          <div>initialStateSimple: {debugInfo.initialStateSimple}</div>
          <div>useSimpleApproach: {String(debugInfo.useSimpleApproach)}</div>
          <button 
            onClick={() => setUseSimpleApproach(!useSimpleApproach)} 
            className="mt-2 px-2 py-1 bg-green-600 rounded text-xs mr-2"
          >
            Toggle Approach
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-2 sm:px-4 py-6">
          <motion.div 
            className="text-center space-y-3"
            variants={getReducedMotionVariants(heroAnimations.container, !!shouldReduceMotion)}
            initial={useSimpleApproach ? getInitialAnimationStateSimple('home-page') : getInitialAnimationState('home-page')}
            animate="visible"
            onAnimationStart={() => {
              if (shouldAnimateOnMount('home-page')) {
                markAsAnimated('home-page')
              }
            }}
          >
            <motion.h1 
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              variants={getReducedMotionVariants(heroAnimations.title, !!shouldReduceMotion)}
            >
              Welcome, Mosquedian&apos;s
            </motion.h1>
            <motion.p 
              className="text-muted-foreground max-w-xl mx-auto"
              variants={getReducedMotionVariants(heroAnimations.subtitle, !!shouldReduceMotion)}
            >
              Browse recently posted lost and found items.
            </motion.p>
            <motion.div 
              className="flex flex-col gap-2 items-center"
              variants={getReducedMotionVariants(heroAnimations.buttons, !!shouldReduceMotion)}
            >
              <CampusGuardianDialog />
              <Button onClick={handleReportClick} size="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Report Item
              </Button>
            </motion.div>
          </motion.div>
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
        onContinue={() => {
          setRulesOpen(false)
          router.push("/post")
        }}
      />

      {/* Search & Filter Section */}
      <section className="container mx-auto px-2 sm:px-4 py-2 pb-5">
        <div className="max-w-xl mx-auto">
          <ItemsSearchFilterBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filter={filter}
            onFilterChange={(next) => setFilter(next)}
          />
        </div>
      </section>

      {/* Items Grid */}
      <section className="container mx-auto px-0.5 sm:px-4 pb-2">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : filteredItems.length === 0 && hasAttemptedFetch ? (
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
                <AnimatedLink href="/items" delay={300} trigger={!isLoading}>
                  View all items
                </AnimatedLink>
              </div>
            </div>
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1"
              variants={getReducedMotionVariants(cardAnimations.container, !!shouldReduceMotion)}
              initial={useSimpleApproach ? getInitialAnimationStateSimple('home-page') : getInitialAnimationState('home-page')}
              animate="visible"
              onAnimationStart={() => {
                if (shouldAnimateOnMount('home-page')) {
                  markAsAnimated('home-page')
                }
              }}
            >
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
            </motion.div>
          </div>
        )}
      </section>
    </main>
  )
} 