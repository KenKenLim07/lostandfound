"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, X } from "lucide-react"

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

  React.useEffect(() => {
    if (!open || data) return
    setLoading(true)
    fetch("/api/leaderboard")
      .then((r) => r.json() as Promise<ApiResp>)
      .then((json) => {
        if (json.error) {
          setError(json.error)
        } else {
          setData((json.leaderboard ?? []).slice(0, 20))
        }
      })
      .catch(() => setError("Failed to load leaderboard"))
      .finally(() => setLoading(false))
  }, [open, data])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <Trophy className="h-4 w-4 mr-2" /> Campus Guardian
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-full">
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
                  <div className="text-xs text-muted-foreground tabular-nums">{entry.count} returns</div>
                </li>
              ))}
            </ol>
          )}
          <div className="text-[11px] text-muted-foreground">
            <div>Notes:</div>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>For lost reports, we credit the person who returned the item and show the owner as recipient.</li>
              <li>For found reports, we credit the original reporter (finder) and show the owner as recipient.</li>
              <li>This can be refined by capturing an explicit “Returned by” name universally.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 