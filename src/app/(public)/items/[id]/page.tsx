import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Image from "next/image"
import type { Database, Tables } from "@/types/database"
import { notFound } from "next/navigation"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message
    return typeof msg === "string" ? msg : "Failed to load item"
  }
  return "Failed to load item"
}

export default async function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data, error } = await supabase
    .from("items")
    .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
    .eq("id", id)
    .single()

  if (error?.code === "PGRST116" || !data) return notFound()
  if (error) throw new Error(getErrorMessage(error))

  const item = data as Tables<"items">
  const isMockUrl = item.image_url?.includes("your-bucket-url.supabase.co") ?? false

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
      <div className="fixed right-2 top-2 z-10">
        <Button asChild size="icon" variant="ghost">
          <Link href="/" aria-label="Close details">
            <X className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{item.title ?? item.name}</h1>
        <div className="text-muted-foreground text-sm">
          <span className="font-medium">Type:</span> {item.type.toUpperCase()} ·
          <span className="ml-2 font-medium">Posted:</span> {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
        </div>
      </header>

      <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title ?? item.name}
            fill
            sizes="(min-width:1024px) 1024px, 100vw"
            unoptimized={isMockUrl}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">No image</div>
        )}
      </div>

      <section className="space-y-2">
        <div className="text-sm"><span className="font-medium">Date Lost/Found:</span> {new Date(item.date).toLocaleDateString()}</div>
        {item.location && (
          <div className="text-sm"><span className="font-medium">Location:</span> {item.location}</div>
        )}
        {item.contact_number && (
          <div className="text-sm"><span className="font-medium">Contact:</span> {item.contact_number}</div>
        )}
        {item.description && (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
        )}
      </section>
    </main>
  )
} 