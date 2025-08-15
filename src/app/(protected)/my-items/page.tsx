"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/hooks/useSupabase"
import type { Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { Trash2, CheckCircle, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/system/ToastProvider"
import { ErrorHandlers } from "@/lib/errorHandling"

type Item = Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at" | "returned_party">

export default function MyItemsPage() {
  const supabase = useSupabase()
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [markReturnedDialog, setMarkReturnedDialog] = useState<{
    open: boolean
    item: Item | null
  }>({ open: false, item: null })
  const [returnedParty, setReturnedParty] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/")
          return
        }

        const { data, error } = await supabase
          .from("items")
          .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at, returned_party")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        if (isMounted) {
          setItems(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load items")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [supabase, router])

  async function markAsReturned(item: Item) {
    if (!returnedParty.trim()) return

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("items")
          .update({
            status: "returned",
            returned_party: returnedParty.trim()
          })
          .eq("id", item.id)

        if (error) throw error

        // Update local state
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { ...i, status: "returned" as const, returned_party: returnedParty.trim() }
            : i
        ))

        setMarkReturnedDialog({ open: false, item: null })
        setReturnedParty("")
      } catch (error) {
        ErrorHandlers.itemOperation("update", error, toast)
      }
    })
  }

  async function deleteItem(item: Item) {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("id", item.id)

        if (error) throw error

        // Update local state
        setItems(prev => prev.filter(i => i.id !== item.id))
      } catch (error) {
        ErrorHandlers.itemOperation("delete", error, toast)
      }
    })
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
    <main className="container mx-auto px-2 sm:px-4 py-4 overflow-x-hidden">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">My Reports</h1>
        <p className="text-muted-foreground text-sm">Manage your lost and found item reports.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">You haven&apos;t posted any items yet.</p>
          <Button asChild>
            <Link href="/post">Post your first item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <ItemCard
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
              
              {/* Action buttons overlay */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0"
                    asChild
                  >
                    <Link href={`/items/${item.id}`}>
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                  
                  {item.status !== "returned" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0"
                      onClick={() => setMarkReturnedDialog({ open: true, item })}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={() => deleteItem(item)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Returned info */}
              {item.status === "returned" && item.returned_party && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-green-600/90 text-white text-xs px-2 py-1 rounded text-center">
                    {item.type === "lost" ? "Returned to" : "Returned by"}: {item.returned_party}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mark as Returned Dialog */}
      <Dialog 
        open={markReturnedDialog.open} 
        onOpenChange={(open) => setMarkReturnedDialog({ open, item: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mark as Returned
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1">
              <Label htmlFor="returned-party">
                {markReturnedDialog.item?.type === "lost" ? "Returned to" : "Returned by"}
              </Label>
              <Input
                id="returned-party"
                value={returnedParty}
                onChange={(e) => setReturnedParty(e.target.value)}
                placeholder="Enter name"
                className="h-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMarkReturnedDialog({ open: false, item: null })}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => markReturnedDialog.item && markAsReturned(markReturnedDialog.item)}
                disabled={isPending || !returnedParty.trim()}
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
} 