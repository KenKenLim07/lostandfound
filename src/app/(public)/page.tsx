import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientHomeHeader } from "@/components/home/ClientHomeHeader"
import { BrowseAllButton } from "@/components/home/BrowseAllButton"
import RecentlyReturnedServer from "@/components/home/RecentlyReturnedServer"
import RecentlyLostServer from "@/components/home/RecentlyLostServer"
import RecentlyFoundServer from "@/components/home/RecentlyFoundServer"

function ReturnedStripSkeleton() {
  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="flex items-center justify-between mb-2 pl-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2 overflow-hidden pl-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0 rounded-xl border bg-white shadow-xs p-2">
            <Skeleton className="h-20 w-full rounded-md" />
            <div className="mt-2 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function GridSkeleton({ title }: { title: string }) {
  return (
    <section className="container mx-auto px-0.5 sm:px-4 py-2">
      <div className="pl-2 flex items-center justify-between mb-2">
        <div className="text-base font-semibold tracking-tight">{title}</div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-2">
            <Skeleton className="h-36 w-full rounded-md" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function PublicHomePage() {
  return (
    <main className="min-h-screen">
      <ClientHomeHeader />

      <Suspense fallback={<ReturnedStripSkeleton />}> 
        <RecentlyReturnedServer />
      </Suspense>
      
      {/* Browse All Items Section - Optimal placement after returned strip */}
      <BrowseAllButton />
      
      {/* Removed divider here to let the button act as the separator */}

      <Suspense fallback={<GridSkeleton title="Recently Lost" />}> 
        <RecentlyLostServer />
      </Suspense>
      
      <div className="border-t border-border/40 my-4" />

      <Suspense fallback={<GridSkeleton title="Recently Found" />}> 
        <RecentlyFoundServer />
      </Suspense>
    </main>
  )
} 