"use client"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"

export default function MyItemsPage() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<
    Array<Pick<Tables<"items">, "id" | "title" | "name" | "type" | "status" | "image_url" | "created_at">>
  >([])
  const [error, setError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)

  // Returned modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returningItemId, setReturningItemId] = useState<string | null>(null)
  const [returnedTo, setReturnedTo] = useState("")
  const [returnedYearSection, setReturnedYearSection] = useState("")
  const [returnedDate, setReturnedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [isSubmittingReturn, startSubmittingReturn] = useTransition()

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const session = data.session
      if (!session) {
        router.replace("/")
        return
      }
      setUserId(session.user.id)
      setIsLoadingUser(false)
    })
    return () => {
      isMounted = false
    }
  }, [supabase, router])

  useEffect(() => {
    if (!userId) return
    setIsFetching(true)
    setError(null)
    
    async function fetchItems() {
      if (!userId) return
      try {
        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, status, image_url, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        
        if (error) setError(error.message ? error.message : "Failed to load items")
        setItems((data as any) || [])
      } catch (err) {
        setError("Failed to load items")
      } finally {
        setIsFetching(false)
      }
    }
    
    fetchItems()
  }, [supabase, userId])

  function openReturnModal(itemId: string) {
    setReturningItemId(itemId)
    setReturnedTo("")
    setReturnedYearSection("")
    setReturnedDate(new Date().toISOString().slice(0, 10))
    setUseCustomDate(false)
    setReturnModalOpen(true)
  }

  function markAsReturned(e: React.FormEvent) {
    e.preventDefault()
    if (!returningItemId || !userId) return
    startSubmittingReturn(async () => {
      const updatePayload: Partial<Tables<"items">> = {
        status: "returned",
        returned_to: returnedTo || null,
        returned_year_section: returnedYearSection || null,
        returned_at: useCustomDate ? returnedDate : new Date().toISOString().slice(0, 10)
      }

      const { error } = await supabase
        .from("items")
        .update(updatePayload as any)
        .eq("id", returningItemId)
        .eq("user_id", userId)
      if (error) {
        alert(`Failed to mark as returned: ${error.message}`)
        return
      }
      setItems((prev) => prev.map((it) => (it.id === returningItemId ? { ...it, status: "returned" } : it)))
      setReturnModalOpen(false)
    })
  }

  async function handleDelete(itemId: string, imageUrl: string | null) {
    if (!confirm("Delete this item? This cannot be undone.")) return
    setError(null)
    // Remove storage asset if present
    try {
      if (imageUrl) {
        const url = new URL(imageUrl)
        const prefix = "/storage/v1/object/public/items/"
        const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname.split("/items/")[1]
        if (path) {
          await supabase.storage.from("items").remove([path])
        }
      }
    } catch {}

    const { error: delErr } = await supabase.from("items").delete().eq("id", itemId).eq("user_id", userId!)
    if (delErr) {
      setError(delErr.message)
      return
    }
    setItems((prev) => prev.filter((it) => it.id !== itemId))
  }

  if (isLoadingUser) {
    return (
      <main className="container mx-auto px-3 sm:px-6 py-6">
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-3 sm:px-6 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">My Items</h1>
        <p className="text-sm text-muted-foreground">Manage your posted items. Mark returned or delete.</p>
      </header>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      {isFetching ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t posted any items yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {items.map((item) => {
            const isMock = item.image_url?.includes("your-bucket-url.supabase.co") ?? false
            return (
              <li key={item.id} className="rounded-lg border bg-card">
                <div className="flex gap-2 p-2">
                  <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title ?? item.name} fill className="object-cover" unoptimized={isMock} />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium truncate">{item.title ?? item.name}</h3>
                      <span className="text-[10px] rounded px-1.5 py-0.5 border">
                        {item.status === "returned" ? "RETURNED" : item.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Posted {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {item.status !== "returned" && (
                        <Button size="sm" variant="outline" onClick={() => openReturnModal(item.id)}>Mark returned</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id, item.image_url)}>Delete</Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Mark Returned Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark item as returned</DialogTitle>
          </DialogHeader>
          <form onSubmit={markAsReturned} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="returned_to">Returned to (name)</Label>
              <Input id="returned_to" value={returnedTo} onChange={(e) => setReturnedTo(e.target.value)} placeholder="Student name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="returned_ys">Year & section (optional)</Label>
              <Input id="returned_ys" value={returnedYearSection} onChange={(e) => setReturnedYearSection(e.target.value)} placeholder="e.g., 3rd year – BSIT 3A" />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <input id="use_custom_date" type="checkbox" checked={useCustomDate} onChange={(e) => setUseCustomDate(e.target.checked)} />
                <Label htmlFor="use_custom_date">Set custom date</Label>
              </div>
              {useCustomDate && (
                <div className="grid gap-1.5">
                  <Label htmlFor="returned_at">Date returned</Label>
                  <Input id="returned_at" type="date" value={returnedDate} onChange={(e) => setReturnedDate(e.target.value)} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={isSubmittingReturn}>Confirm</Button>
              <Button type="button" variant="ghost" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
} 