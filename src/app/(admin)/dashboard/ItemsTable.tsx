"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import type { Database, Tables } from "@/types/database"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditItemDialog, type EditableItem } from "./EditItemDialog"

export type AdminItemsTableProps = {
  pageSize?: number
}

type Row = Pick<
  Tables<"items">,
  | "id"
  | "title"
  | "type"
  | "status"
  | "date"
  | "created_at"
  | "image_url"
  | "user_id"
> & {
  profile?: {
    full_name: string | null
    school_id: string | null
    year_section: string | null
  } | null
}

export function ItemsTable({ pageSize = 50 }: AdminItemsTableProps) {
  const supabase = useSupabase()
  const [items, setItems] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null)

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "returned">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all")
  const [search, setSearch] = useState("")
  const [input, setInput] = useState("")
  const debounceRef = useRef<number | null>(null)

  // Action states
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<EditableItem | null>(null)

  const [returnOpen, setReturnOpen] = useState(false)
  const [returningItemId, setReturningItemId] = useState<string | null>(null)
  const [returnedTo, setReturnedTo] = useState("")
  const [returnedYearSection, setReturnedYearSection] = useState("")
  const [returnedDate, setReturnedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setSearch(input.trim()), 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [input])

  const buildQuery = useCallback(() => {
    let query = supabase
      .from("items")
      .select("id, title, type, status, date, created_at, image_url, user_id")

    if (statusFilter === "active") {
      query = query.neq("status", "returned")
    } else if (statusFilter === "returned") {
      query = query.eq("status", "returned")
    }

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter)
    }

    if (search) {
      const like = `%${search}%`
      query = query.or(
        `title.ilike.${like},description.ilike.${like}`
      )
    }

    return query
  }, [statusFilter, typeFilter, search, supabase])

  const resetAndLoad = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setCursor(null)
    try {
      const { data, error: err } = await buildQuery()
        .order("created_at", { ascending: false })
        .limit(pageSize)
      if (err) throw err
      const rows = (data ?? []) as Row[]
      
      // Fetch profile data for each item
      const itemsWithProfiles: Row[] = await Promise.all(
        rows.map(async (item) => {
          if (item.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, school_id, year_section")
              .eq("id", item.user_id)
              .single()
            return { ...item, profile: profile || undefined }
          }
          return { ...item, profile: undefined }
        })
      )
      
      setItems(itemsWithProfiles)
      setHasMore(itemsWithProfiles.length === pageSize)
      if (itemsWithProfiles.length > 0) setCursor({ created_at: itemsWithProfiles[itemsWithProfiles.length - 1].created_at!, id: itemsWithProfiles[itemsWithProfiles.length - 1].id })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load items"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [buildQuery, pageSize, supabase])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return
    setIsLoading(true)
    setError(null)
    try {
      const q = buildQuery()
        .order("created_at", { ascending: false })
        .limit(pageSize)
      if (cursor) {
        q.lt("created_at", cursor.created_at)
      }
      const { data, error: err } = await q
      if (err) throw err
      const rows = (data ?? []) as Row[]
      
      // Fetch profile data for each item
      const itemsWithProfiles: Row[] = await Promise.all(
        rows.map(async (item) => {
          if (item.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, school_id, year_section")
              .eq("id", item.user_id)
              .single()
            return { ...item, profile: profile || undefined }
          }
          return { ...item, profile: undefined }
        })
      )
      
      setItems((prev) => [...prev, ...itemsWithProfiles])
      setHasMore(itemsWithProfiles.length === pageSize)
      if (itemsWithProfiles.length > 0) setCursor({ created_at: itemsWithProfiles[itemsWithProfiles.length - 1].created_at!, id: itemsWithProfiles[itemsWithProfiles.length - 1].id })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load more"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [buildQuery, cursor, hasMore, isLoading, pageSize, supabase])

  useEffect(() => {
    resetAndLoad()
  }, [resetAndLoad])

  function openEdit(row: Row) {
    const draft: EditableItem = {
      id: row.id,
      title: row.title,
      description: null,
      status: row.status ?? "active",
    }
    setEditItem(draft)
    setEditOpen(true)
  }

  function onItemSaved(partial: EditableItem) {
    setItems((prev) => prev.map((it) => (it.id === partial.id ? { ...it, title: partial.title ?? it.title, status: partial.status ?? it.status } : it)))
  }

  function openReturn(row: Row) {
    setReturningItemId(row.id)
    setReturnedTo("")
    setReturnedYearSection("")
    setReturnedDate(new Date().toISOString().slice(0, 10))
    setUseCustomDate(false)
    setReturnOpen(true)
  }

  async function submitReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!returningItemId) return
    setIsSubmittingReturn(true)
    try {
      const updatePayload: Partial<Tables<"items">> = {
        status: "returned",
        returned_party: returnedTo || null,
        returned_year_section: returnedYearSection || null,
        returned_at: useCustomDate ? returnedDate : new Date().toISOString().slice(0, 10),
      }
      const { error } = await supabase.from("items").update(updatePayload).eq("id", returningItemId)
      if (error) throw error
      setItems((prev) => prev.map((it) => (it.id === returningItemId ? { ...it, status: "returned" } : it)))
      setReturnOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to mark as returned")
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm("Delete this item? This cannot be undone.")) return
    try {
      // Remove storage asset if present
      if (row.image_url) {
        const url = new URL(row.image_url)
        const prefix = "/storage/v1/object/public/items/"
        const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname.split("/items/")[1]
        if (path) {
          await supabase.storage.from("items").remove([path])
        }
      }
      const { error } = await supabase.from("items").delete().eq("id", row.id)
      if (error) throw error
      setItems((prev) => prev.filter((it) => it.id !== row.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete item")
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "returned")}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "lost" | "found")}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">All</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search title, name, location…"
            className="h-9 w-[220px] rounded-md border bg-background px-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all"); setTypeFilter("all"); setInput(""); setSearch("")
            }}
            className="h-9 rounded-md border px-3 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="px-3 py-2 border-r border-border/50">Title</th>
              <th className="px-3 py-2 border-r border-border/50">Type</th>
              <th className="px-3 py-2 border-r border-border/50">Current Status</th>
              <th className="px-3 py-2 border-r border-border/50">Posted by</th>
              <th className="px-3 py-2 border-r border-border/50">Course / Y&S</th>
              <th className="px-3 py-2 border-r border-border/50">Date</th>
              <th className="px-3 py-2 border-r border-border/50">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !isLoading ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground border-r border-border/50" colSpan={8}>No items match your filters.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-border/50">
                  <td className="px-3 py-2 font-medium max-w-[260px] truncate border-r border-border/50">{item.title ?? "—"}</td>
                  <td className="px-3 py-2 capitalize border-r border-border/50">{item.type}</td>
                  <td className="px-3 py-2 capitalize border-r border-border/50">{item.status ?? "active"}</td>
                  <td className="px-3 py-2 border-r border-border/50">{item.profile?.full_name ?? "—"}</td>
                  <td className="px-3 py-2 border-r border-border/50">{item.profile?.year_section ?? "—"}</td>
                  <td className="px-3 py-2 border-r border-border/50">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 border-r border-border/50">{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                  <td className="px-3 py-2 border-l border-border/50">
                    <div className="flex items-center gap-3 h-full">
                      <Link href={`/items/${item.id}`} className="text-foreground/60 hover:text-foreground underline underline-offset-4">View</Link>
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                      {item.status !== "returned" ? (
                        <Button size="sm" variant="outline" onClick={() => openReturn(item)} className="w-28">Mark returned</Button>
                      ) : (
                        <span className="inline-flex items-center justify-center h-8 px-3 text-xs text-muted-foreground bg-muted rounded-md border border-border w-28">Returned</span>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {isLoading && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground border-r border-border/50" colSpan={8}>Loading…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="h-9 rounded-md border px-3 text-sm"
          >
            {isLoading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={editItem}
        onSaved={onItemSaved}
      />

      {/* Mark Returned Modal */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Returned</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitReturn} className="space-y-3">
            <div className="grid gap-1">
              <label className="text-sm">Returned by</label>
              <input className="h-9 rounded-md border px-2 text-sm" value={returnedTo} onChange={(e) => setReturnedTo(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Course / Year & Section</label>
              <input className="h-9 rounded-md border px-2 text-sm" value={returnedYearSection} onChange={(e) => setReturnedYearSection(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Use custom date</label>
              <div className="flex items-center gap-2">
                <input id="use-custom" type="checkbox" checked={useCustomDate} onChange={(e) => setUseCustomDate(e.target.checked)} />
                <label htmlFor="use-custom" className="text-sm">Set a specific date</label>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Returned at</label>
              <input type="date" className="h-9 rounded-md border px-2 text-sm" value={returnedDate} onChange={(e) => setReturnedDate(e.target.value)} disabled={!useCustomDate} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmittingReturn}>{isSubmittingReturn ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
} 