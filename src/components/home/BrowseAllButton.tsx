"use client"

import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

export function BrowseAllButton() {
  const router = useRouter()

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="text-center">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => router.push('/items')}
          className="gap-3 px-8 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Search className="h-5 w-5" />
          Browse All Items
          <span className="text-sm text-muted-foreground font-normal">
            • Search & Filter
          </span>
        </Button>
      </div>
    </section>
  )
} 