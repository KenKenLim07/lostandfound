"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import type { Tables } from "@/types/database"
import { ArrowLeft, Calendar, MapPin, Phone, CheckCircle, User, GraduationCap, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

type ItemWithProfile = Tables<"items"> & {
  profile?: {
    full_name: string | null
    school_id: string | null
    year_section: string | null
    contact_number: string | null
  } | null
}

export default function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [item, setItem] = useState<ItemWithProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadItem() {
      try {
  const { id } = await params
        const response = await fetch(`/api/items/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Item not found")
          } else {
            setError("Failed to load item")
          }
          return
        }
        
        const data = await response.json()
        setItem(data)
      } catch (err) {
        setError("Failed to load item")
      } finally {
        setIsLoading(false)
      }
    }

    loadItem()
  }, [params])

  const handleBackNavigation = () => {
    // Check if user came from home page via search params
    const fromHome = searchParams.get('from')
    
    if (fromHome === 'home') {
      router.push('/')
    } else if (fromHome === 'items') {
      router.push('/items', { scroll: true })
    } else {
      // Fallback: try to go back in browser history
      if (window.history.length > 1) {
        router.back()
      } else {
        // If no history, default to items page
        router.push('/items', { scroll: true })
      }
    }
  }

  const isMockUrl = item?.image_url?.includes("your-bucket-url.supabase.co") ?? false
  const isReturned = item?.status === "returned"
  const contactHref = item?.profile?.contact_number ? `tel:${item.profile.contact_number.replace(/\s+/g, "")}` : null

  if (isLoading) {
    return (
      <main className="mx-auto w-full md:max-w-3xl mx-2 px-3 sm:px-4 md:px-6 py-4 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <Skeleton className="w-full aspect-square rounded-lg" />
        <Skeleton className="w-full h-64 rounded-lg" />
      </main>
    )
  }

  if (error || !item) {
    return (
      <main className="mx-auto w-full md:max-w-3xl mx-2 px-3 sm:px-4 md:px-6 py-4 space-y-4">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{error || "Failed to load item"}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full md:max-w-3xl mx-2 px-3 sm:px-4 md:px-6 py-4 space-y-4">
      {/* Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 h-9 w-9"
          onClick={handleBackNavigation}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Media */}
      <div className="relative w-[calc(100%+1rem)] -mx-2 sm:w-[calc(100%+2rem)] sm:-mx-4 md:w-full md:mx-0 bg-muted overflow-hidden aspect-square md:rounded-lg">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title ?? (item.profile?.full_name || "Unknown Item")}
            fill
            sizes="(min-width:1024px) 1024px, 100vw"
            unoptimized={isMockUrl}
            className="object-contain"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">No image</div>
        )}
      </div>

      {/* Details Card */}
      <Card className="w-[calc(100%+1rem)] -mx-2 sm:w-[calc(100%+2rem)] sm:-mx-4 md:w-full md:mx-0">
        <CardHeader className="p-4 sm:p-6 pb-2 text-center space-y-2">
          {/* Removed type/returned pills above title */}
          <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
            {item.title ?? (item.profile?.full_name || "Unknown Item")}
          </h1>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pt-2 pb-4 sm:pb-6 space-y-4">
          {/* Item Details Section */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Item Details</h3>
            <dl className="text-sm divide-y divide-border">
              {/* Type row (pill) */}
              <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <Tag className="h-4 w-4" />
                  <span>Type</span>
                </dt>
                <dd className="font-medium flex-1">
                  <Badge className={item.type === "lost" ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                    {item.type.toUpperCase()}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <User className="h-4 w-4" />
                  <span>Posted by</span>
                </dt>
                <dd className="font-medium flex-1">{item.profile?.full_name || "Unknown User"}</dd>
              </div>

              {item.profile?.year_section && (
                <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                    <GraduationCap className="h-4 w-4" />
                    <span>Course / Year & Section</span>
                  </dt>
                  <dd className="font-medium flex-1">{item.profile.year_section}</dd>
                </div>
              )}

              <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span>Date Posted</span>
                </dt>
                <dd className="font-medium flex-1">{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</dd>
              </div>

              <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span>Date {item.type === "lost" ? "Lost" : "Found"}</span>
                </dt>
                <dd className="font-medium flex-1">{new Date(item.date).toLocaleDateString()}</dd>
              </div>

              <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                  <span>Current Status</span>
                </dt>
                <dd className="font-medium flex-1">{isReturned ? "Returned" : "Active"}</dd>
              </div>

              {item.location && (
                <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </dt>
                  <dd className="font-medium flex-1">{item.location}</dd>
                </div>
              )}

              {item.profile?.contact_number && (
                <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
                    <Phone className="h-4 w-4" />
                    <span>Contact</span>
                  </dt>
                  <dd className="flex-1">
                    {contactHref ? (
                      <a href={contactHref} className="font-medium underline underline-offset-4 hover:text-foreground">
                        {item.profile.contact_number}
                      </a>
                    ) : (
                      <span className="font-medium">{item.profile.contact_number}</span>
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
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Return Details</h3>
                <div className="grid gap-3 rounded-md border bg-green-50 p-3 sm:p-4 text-green-800">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Item has been returned</span>
                  </div>
                  <div className="grid gap-2 text-sm">
                    {item.returned_party && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {item.type === "found" ? "Returned to" : "Returned by"}: <span className="font-medium text-green-900">{item.returned_party}</span>
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
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Description</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{item.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
} 