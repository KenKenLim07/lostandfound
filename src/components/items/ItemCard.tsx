import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Package, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { cardAnimations, getReducedMotionVariants, shouldAnimateOnMount, markAsAnimated, markNavigationTime, getInitialAnimationState } from "@/lib/animations"
import { imageCache } from "@/lib/imageCache"
import { useReducedMotion } from "framer-motion"
import { useEffect } from "react"

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return ""
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = Math.max(0, now - then)
  const sec = Math.floor(diffMs / 1000)
  if (sec < 5) return "just now"
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return min === 1 ? "1 min ago" : `${min} mins ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return day === 1 ? "1 day ago" : `${day} days ago`
  const week = Math.floor(day / 7)
  return week === 1 ? "1 week ago" : `${week} weeks ago`
}

export type ItemCardProps = {
  id: string
  title?: string | null
  name: string
  type: "lost" | "found"
  description: string | null
  date: string
  location: string | null
  contactNumber: string | null
  imageUrl: string | null
  status: "active" | "returned" | null
  createdAt?: string | null
  href?: string
  className?: string
}

export function ItemCard(props: ItemCardProps) {
  const {
    title,
    name,
    type,
    date,
    location,
    imageUrl,
    status,
    createdAt,
    href,
    className,
  } = props

  const typePillClasses = type === "lost" ? "bg-red-600 text-white" : "bg-green-600 text-white"
  const relativeTimeLabel = formatRelativeTime(createdAt ?? date)
  const isMockUrl = imageUrl?.includes("your-bucket-url.supabase.co") ?? false
  
  // Animation support
  const shouldReduceMotion = useReducedMotion()

  // Track navigation time for animation state management
  useEffect(() => {
    markNavigationTime('item-cards')
  }, [])

  // Preload image to prevent blinking on navigation back
  useEffect(() => {
    if (imageUrl && !isMockUrl) {
      imageCache.preload(imageUrl).catch(() => {
        // Silently fail preloading
      })
    }
  }, [imageUrl, isMockUrl])

  const CardMedia = (
    <div className="relative aspect-square bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title ?? name}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 50vw"
          unoptimized={isMockUrl}
          className="object-cover transition-opacity duration-200"
          priority={false} // Don't prioritize all images, let preloading handle it
          onLoad={(e) => {
            // Smooth fade-in when image loads
            const target = e.target as HTMLImageElement
            target.style.opacity = '1'
          }}
          style={{ opacity: 0 }} // Start transparent, fade in on load
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <Package className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground line-clamp-2">
              {title ?? name}
            </p>
            {location && (
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="absolute right-2 top-2 inline-flex items-center gap-2 z-20">
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", typePillClasses)}>
          {type.toUpperCase()}
        </span>
      </div>
      {status === "returned" && (
        <div className="absolute inset-0 grid place-items-center z-10">
          <span className="px-3 py-1 rounded-md bg-blue-600/80 text-white text-xs sm:text-sm font-semibold tracking-wide">
            RETURNED
          </span>
        </div>
      )}
      {href && imageUrl && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-black/60 text-white text-xs font-semibold px-2 py-0.5 border border-white/20 text-center">
            Tap to view details
          </div>
        </div>
      )}
    </div>
  )

  return (
    <motion.article
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden", className)}
      variants={getReducedMotionVariants(cardAnimations.item, !!shouldReduceMotion)}
      whileHover={shouldReduceMotion ? undefined : "hover"}
      whileTap={shouldReduceMotion ? undefined : "tap"}
      initial={getInitialAnimationState('item-cards')}
      animate="visible"
      onAnimationStart={() => {
        if (shouldAnimateOnMount('item-cards')) {
          markAsAnimated('item-cards')
        }
      }}
    >
      {href ? (
        <Link href={href} aria-label={`View details for ${title ?? name}`}>
          {CardMedia}
        </Link>
      ) : (
        CardMedia
      )}
      <div className="p-2 sm:p-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          {href ? (
            <Link href={href} className="block min-w-0">
              <h3 className="text-sm sm:text-base font-semibold leading-tight line-clamp-1">
                {title ?? name}
              </h3>
            </Link>
          ) : (
            <h3 className="text-sm sm:text-base font-semibold leading-tight line-clamp-2 min-w-0">{title ?? name}</h3>
          )}
          {relativeTimeLabel && (
            <span className="shrink-0 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{relativeTimeLabel}</span>
          )}
        </div>
      </div>
    </motion.article>
  )
}