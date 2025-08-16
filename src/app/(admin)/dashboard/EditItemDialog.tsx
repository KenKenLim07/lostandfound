"use client"

import { useEffect, useState, useTransition } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import type { Database, Tables } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type EditableItem = Pick<
  Tables<"items">,
  "id" | "title" | "description" | "status"
>

export function EditItemDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: EditableItem | null
  onSaved: (next: EditableItem) => void
}) {
  const supabase = useSupabase()
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [status, setStatus] = useState(item?.status ?? "active")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync when dialog opens or item changes
  useEffect(() => {
    if (open && item) {
    setTitle(item.title ?? "")
    setDescription(item.description ?? "")
    setStatus(item.status ?? "active")
  }
  }, [open, item])

  async function save() {
    if (!item) return
    setIsSaving(true)
    setError(null)
    try {
      const payload: Partial<Tables<"items">> = {
        title: title || null,
        description: description || null,
        status: status || null,
      }
      const { error } = await supabase.from("items").update(payload).eq("id", item.id)
      if (error) throw error
      onSaved({ id: item.id, title: payload.title ?? null, description: payload.description ?? null, status: payload.status ?? null })
      onOpenChange(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save item"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm">Title</label>
            <input className="h-9 rounded-md border px-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Description</label>
            <textarea className="min-h-[80px] rounded-md border px-2 py-1 text-sm" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Status</label>
            <select className="h-9 rounded-md border px-2 text-sm" value={status ?? "active"} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="button" onClick={save} disabled={isSaving}>{isSaving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 