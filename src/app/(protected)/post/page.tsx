"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database, TablesInsert } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function PostItemPage() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [type, setType] = useState<"lost" | "found">("lost")
  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [file, setFile] = useState<File | null>(null)

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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!userId) return

    startTransition(async () => {
      try {
        // 1) Upload image if provided
        let image_url: string | null = null
        const bucket = "items"
        if (file) {
          const fileExt = file.name.split(".").pop()
          const fileName = `${crypto.randomUUID()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { upsert: false })
          if (uploadError) throw uploadError
          const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName)
          image_url = publicUrl.publicUrl
        }

        // 2) Insert item
        const payload: TablesInsert<"items"> = {
          user_id: userId,
          type,
          title,
          name: name || title,
          description: description || null,
          date: date || new Date().toISOString().slice(0, 10),
          location: location || null,
          contact_number: contactNumber || null,
          image_url,
          status: "active",
        }

        const { error: insertError } = await supabase.from("items").insert(payload)
        if (insertError) throw insertError

        setSuccess("Item posted successfully.")
        router.push("/")
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      }
    })
  }

  if (isLoadingUser) {
    return (
      <main className="mx-auto max-w-2xl p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">Checking authentication…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">Post Lost/Found Item</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>Type</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant={type === "lost" ? "default" : "outline"} onClick={() => setType("lost")}>Lost</Button>
            <Button type="button" variant={type === "found" ? "default" : "outline"} onClick={() => setType("found")}>Found</Button>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Black Backpack" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Item Name (optional)</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Backpack" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Color, brand, identifying marks…" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date">Date Lost/Found</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact">Contact Number</Label>
          <Input id="contact" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="image">Photo</Label>
          <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
        {success && <p className="text-green-600 text-sm" role="status">{success}</p>}

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? "Posting…" : "Post Item"}</Button>
        </div>
      </form>
    </main>
  )
} 