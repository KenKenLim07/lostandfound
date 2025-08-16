"use client"

import { useEffect, useState } from "react"
import { Trophy, ArrowLeft, Info, Search, HandHeart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const LEADERBOARD_CACHE_KEY = "leaderboard_v1"
const LEADERBOARD_CACHE_TTL_MS = 300_000 // 5 minutes

type Leader = {
  actor: string
  count: number
  lastRecipient: string | null
  lastReturnedAt: string | null
}

export default function CampusGuardianPage() {
  const [leaderboard, setLeaderboard] = useState<Leader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        // Try to get preloaded data first
        try {
          const cached = sessionStorage.getItem(LEADERBOARD_CACHE_KEY)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (Date.now() - parsed.ts < LEADERBOARD_CACHE_TTL_MS && parsed.leaderboard) {
              setLeaderboard(parsed.leaderboard.slice(0, 50))
              setIsLoading(false)
              return // Use cached data
            }
          }
        } catch {
          // Ignore cache errors, fall back to API
        }

        // Fall back to API call
        const response = await fetch("/api/leaderboard")
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
        } else {
          const leaderboardData = data.leaderboard ?? []
          setLeaderboard(leaderboardData.slice(0, 50))
          
          // Cache the fresh data
          try {
            sessionStorage.setItem(
              LEADERBOARD_CACHE_KEY,
              JSON.stringify({ 
                leaderboard: leaderboardData, 
                ts: Date.now() 
              })
            )
          } catch {
            // Ignore cache errors
          }
        }
      } catch {
        setError("Failed to load leaderboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  // Listen for item status changes to refresh data
  useEffect(() => {
    const handleItemStatusChange = () => {
      // Clear cache and force refresh
      sessionStorage.removeItem(LEADERBOARD_CACHE_KEY)
      setIsLoading(true)
      
      // Refresh data
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            const leaderboardData = data.leaderboard ?? []
            setLeaderboard(leaderboardData.slice(0, 50))
            
            // Cache the fresh data
            try {
              sessionStorage.setItem(
                LEADERBOARD_CACHE_KEY,
                JSON.stringify({ 
                  leaderboard: leaderboardData, 
                  ts: Date.now() 
                })
              )
            } catch {
              // Ignore cache errors
            }
          }
        })
        .catch(() => setError("Failed to load leaderboard"))
        .finally(() => setIsLoading(false))
    }

    window.addEventListener("itemStatusChanged", handleItemStatusChange)
    return () => window.removeEventListener("itemStatusChanged", handleItemStatusChange)
  }, [])

  const trophyColor = (rank: number) => {
    if (rank === 0) return "text-yellow-500"
    if (rank === 1) return "text-slate-400"
    if (rank === 2) return "text-amber-700"
    return "text-muted-foreground"
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-6">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button asChild variant="ghost" size="sm" className="p-2 h-9 w-9">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h1 className="text-xl sm:text-2xl font-bold">Campus Guardian</h1>
            </div>
          </div>
        </header>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button asChild variant="ghost" size="sm" className="p-2 h-9 w-9">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h1 className="text-xl sm:text-2xl font-bold">Campus Guardian</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Recognizing contributors who helped return items successfully. Rankings are based on total confirmed returns.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No returns yet.</div>
      ) : (
        <>
          <ol className="rounded-xl border overflow-hidden">
            {leaderboard.map((entry, idx) => (
              <li key={entry.actor} className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3 border-b last:border-b-0 bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-muted">
                    <span className="text-sm font-semibold tabular-nums">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {idx < 3 && <Trophy className={`h-4 w-4 ${trophyColor(idx)}`} />}
                      <span className="font-semibold truncate">{entry.actor}</span>
                    </div>
                    {entry.lastRecipient && (
                      <div className="text-xs text-muted-foreground truncate">
                        returned to <span className="font-medium">{entry.lastRecipient}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{entry.count}</div>
                  <div className="text-xs text-muted-foreground">returns</div>
                </div>
              </li>
            ))}
          </ol>

          {/* Sticky Footer with Notes */}
          <div className="mt-8 p-4 rounded-lg border bg-muted/30">
            <div className="text-sm text-muted-foreground space-y-3">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Info className="h-4 w-4" />
                How rankings work:
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Search className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Lost reports:</span> Credit goes to the person who returned the item to the owner
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HandHeart className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Found reports:</span> Credit goes to the finder who returned the item to the owner
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                Rankings are based on total confirmed returns. The system automatically credits the person who performed the return action.
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        Notes:
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>For lost reports, we credit the person who returned the item and show the owner as recipient.</li>
          <li>For found reports, we credit the original reporter (finder) and show the owner as recipient.</li>
          <li>This can be refined by capturing an explicit “Returned by” name universally.</li>
        </ul>
      </div>
    </main>
  )
} 