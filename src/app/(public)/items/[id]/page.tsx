import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Image from "next/image"
import type { Database, Tables } from "@/types/database"
import { notFound } from "next/navigation"
import Link from "next/link"
import { X, Calendar, MapPin, Phone, CheckCircle, User, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
    .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at, returned_to, returned_year_section, returned_at")
    .eq("id", id)
    .single()

  if (error?.code === "PGRST116" || !data) return notFound()
  if (error) throw new Error(getErrorMessage(error))

  const item = data as Tables<"items">
  const isMockUrl = item.image_url?.includes("your-bucket-url.supabase.co") ?? false
  const isReturned = item.status === "returned"

  const contactHref = item.contact_number ? `tel:${item.contact_number.replace(/\s+/g, "")}` : null

  return (
    <main className="mx-auto w-full md:max-w-3xl mx-2 px-3 sm:px-4 md:px-6 py-4 space-y-4">
      <div className="fixed right-2 top-2 z-10">
        <Button asChild size="icon" variant="ghost">
          <Link href="/" aria-label="Close details">
            <X className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {/* Media */}
      <div className="relative aspect-square w-[calc(100%+1rem)] -mx-2 sm:w-[calc(100%+2rem)] sm:-mx-4 md:w-full md:mx-0 bg-muted rounded-none md:rounded-lg overflow-hidden">
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

      {/* Title centered under image */}
      <div className="text-center">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">
          {item.title ?? item.name}
        </h1>
      </div>

      {/* Single comprehensive info card */}
      <Card className="w-[calc(100%+1rem)] -mx-2 sm:w-[calc(100%+2rem)] sm:-mx-4 md:w-full md:mx-0">
        <CardHeader className="p-4 sm:p6 pb-4">
          {/* Header is now empty since we moved title and date */}
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-6">
          {/* Item Details Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Item Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                  <span>Type</span>
                </dt>
                <dd className="flex-1">
                  <Badge className={item.type === "lost" ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                    {item.type.toUpperCase()}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <User className="h-4 w-4" />
                  <span>Posted by</span>
                </dt>
                <dd className="font-medium flex-1">{item.name}</dd>
              </div>

              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span>Date Posted</span>
                </dt>
                <dd className="font-medium flex-1">
                  {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                </dd>
              </div>

              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span>Date {item.type === "lost" ? "Lost" : "Found"}</span>
                </dt>
                <dd className="font-medium flex-1">{new Date(item.date).toLocaleDateString()}</dd>
              </div>

              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                  <span>Status</span>
                </dt>
                <dd className="font-medium flex-1">
                  {isReturned ? "Returned" : "Active"}
                </dd>
              </div>

              {item.location && (
                <div className="flex items-center gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </dt>
                  <dd className="font-medium flex-1">{item.location}</dd>
                </div>
              )}

              {item.contact_number && (
                <div className="flex items-center gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                    <Phone className="h-4 w-4" />
                    <span>Contact</span>
                  </dt>
                  <dd className="flex-1">
                    {contactHref ? (
                      <a href={contactHref} className="font-medium underline underline-offset-4 hover:text-foreground">
                        {item.contact_number}
                      </a>
                    ) : (
                      <span className="font-medium">{item.contact_number}</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Return Details Section */}
          {isReturned && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Return Details</h3>
                <div className="grid gap-3 rounded-md border bg-green-50 p-3 sm:p-4 text-green-800">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Item has been returned</span>
                  </div>
                  <div className="grid gap-2 text-sm">
                    {item.returned_to && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          To: <span className="font-medium text-green-900">{item.returned_to}</span>
                        </span>
                      </div>
                    )}
                    {item.returned_year_section && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>{item.returned_year_section}</span>
                      </div>
                    )}
                    {item.returned_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date: {new Date((item.returned_at as unknown as string)).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Description Section */}
          {item.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Description</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{item.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
} 