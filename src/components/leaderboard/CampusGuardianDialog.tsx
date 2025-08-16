"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, X, Info, Search, HandHeart } from "lucide-react"

const LEADERBOARD_CACHE_KEY = "leaderboard_v1"
const LEADERBOARD_CACHE_TTL_MS = 300_000 // 5 minutes

type Leader = {
  actor: string
  count: number
  lastRecipient: string | null
  lastReturnedAt: string | null
}

type ApiResp = {
  leaderboard?: Leader[]
  error?: string
}

function trophyColor(rank: number) {
  if (rank === 0) return "text-yellow-500"
  if (rank === 1) return "text-slate-400"
  if (rank === 2) return "text-amber-700"
  return "text-muted-foreground"
}

export function CampusGuardianDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<Leader[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const hasLoadedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open) return

    // Try to get preloaded data first
    try {
      const cached = sessionStorage.getItem(LEADERBOARD_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < LEADERBOARD_CACHE_TTL_MS && parsed.leaderboard) {
          setData(parsed.leaderboard.slice(0, 20))
          hasLoadedRef.current = true
          return // Use cached data, no need to fetch
        }
      }
    } catch {
      // Ignore cache errors, fall back to API
    }

    // Fall back to API call if no cached data and not already loaded
    if (!hasLoadedRef.current) {
      setLoading(true)
      fetch("/api/leaderboard")
        .then((r) => r.json() as Promise<ApiResp>)
        .then((json) => {
          if (json.error) {
            setError(json.error)
          } else {
            const leaderboard = json.leaderboard ?? []
            setData(leaderboard.slice(0, 20))
            hasLoadedRef.current = true
            
            // Cache the fresh data
            try {
              sessionStorage.setItem(
                LEADERBOARD_CACHE_KEY,
                JSON.stringify({ 
                  leaderboard, 
                  ts: Date.now() 
                })
              )
            } catch {
              // Ignore cache errors
            }
          }
        })
        .catch(() => setError("Failed to load leaderboard"))
        .finally(() => setLoading(false))
    }
  }, [open]) // Removed 'data' from dependency array

  // Listen for item status changes to refresh data
  React.useEffect(() => {
    const handleItemStatusChange = () => {
      // Clear cache and force refresh
      sessionStorage.removeItem(LEADERBOARD_CACHE_KEY)
      hasLoadedRef.current = false
      
      // If dialog is open, refresh data
      if (open) {
        setLoading(true)
        fetch("/api/leaderboard")
          .then((r) => r.json() as Promise<ApiResp>)
          .then((json) => {
            if (json.error) {
              setError(json.error)
            } else {
              const leaderboard = json.leaderboard ?? []
              setData(leaderboard.slice(0, 20))
              hasLoadedRef.current = true
              
              // Cache the fresh data
              try {
                sessionStorage.setItem(
                  LEADERBOARD_CACHE_KEY,
                  JSON.stringify({ 
                    leaderboard, 
                    ts: Date.now() 
                  })
                )
              } catch {
                // Ignore cache errors
              }
            }
          })
          .catch(() => setError("Failed to load leaderboard"))
          .finally(() => setLoading(false))
      }
    }

    window.addEventListener("itemStatusChanged", handleItemStatusChange)
    return () => window.removeEventListener("itemStatusChanged", handleItemStatusChange)
  }, [open])

  // Reset data when dialog closes to ensure fresh data on next open
  React.useEffect(() => {
    if (!open) {
      setData(null)
      setError(null)
      setLoading(false)
      hasLoadedRef.current = false
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <Trophy className="h-4 w-4 mr-2" /> Campus Guardian
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm w-full mx-auto boder-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Campus Guardian
          </DialogTitle>
          <DialogClose asChild>
            <button aria-label="Close" className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto space-y-3">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!loading && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && data && data.length === 0 && (
            <div className="text-sm text-muted-foreground">No returns yet.</div>
          )}
          {!loading && !error && data && data.length > 0 && (
            <ol className="rounded-md border overflow-hidden">
              {data.map((entry, idx) => (
                <li key={entry.actor} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 shrink-0 grid place-items-center rounded-full bg-muted">
                      <span className="text-xs font-semibold tabular-nums">{idx + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {idx < 3 && <Trophy className={`h-4 w-4 ${trophyColor(idx)}`} />}
                        <span className="font-semibold truncate">{entry.actor}</span>
                      </div>
                      {entry.lastRecipient && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          returned to <span className="font-medium">{entry.lastRecipient}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{entry.count}</div>
                    <div className="text-[10px] text-muted-foreground">returns</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Sticky Footer with Notes */}
        <div className="border-t pt-4 mt-4">
          <div className="text-xs text-muted-foreground space-y-3">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <Info className="h-3 w-3" />
              How rankings work:
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Search className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>Lost reports:</strong> Credit goes to the person who returned the item to the owner</span>
              </div>
              <div className="flex items-start gap-2">
                <HandHeart className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Found reports:</strong> Credit goes to the finder who returned the item to the owner</span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/50">
              Rankings are based on total confirmed returns. The system automatically credits the person who performed the return action.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 