import { Skeleton } from "@/components/ui/skeleton"

export function ItemCardSkeleton() {
  return (
    <article className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-2 sm:p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </article>
  )
} 