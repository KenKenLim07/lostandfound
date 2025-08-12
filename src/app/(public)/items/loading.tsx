import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"

export default function LoadingAllItems() {
  return (
    <main className="container mx-auto px-2 sm:px-4 py-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1" aria-busy>
        {Array.from({ length: 12 }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
} 