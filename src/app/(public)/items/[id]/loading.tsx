import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingItemDetails() {
  return (
    <main className="mx-auto w-full md:max-w-3xl mx-2 px-3 sm:px-4 md:px-6 py-4 space-y-4">
      {/* Close button skeleton */}
      <div className="fixed right-2 top-2 z-10">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* Image skeleton - matches the edge-to-edge mobile layout */}
      <div className="relative aspect-square w-[calc(100%+1rem)] -mx-2 sm:w-[calc(100%+2rem)] sm:-mx-4 md:w-full md:mx-0 bg-muted rounded-none md:rounded-lg overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Title skeleton - centered under image */}
      <div className="text-center">
        <Skeleton className="h-6 w-3/4 mx-auto" />
      </div>

      {/* Main card skeleton */}
      <div className="w-[calc(100%+1rem)] -mx-2 sm:w-[calc(100%+2rem)] sm:-mx-4 md:w-full md:mx-0">
        <div className="border rounded-lg p-4 sm:p-6 space-y-6">
          {/* Item Details section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" /> {/* Section header */}
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" /> {/* Icon */}
                  <Skeleton className="h-4 w-20" /> {/* Label */}
                  <Skeleton className="h-4 flex-1" /> {/* Value */}
                </div>
              ))}
            </div>
          </div>

          {/* Description section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" /> {/* Section header */}
            <Skeleton className="h-16 w-full" /> {/* Description text */}
          </div>
        </div>
      </div>
    </main>
  )
} 