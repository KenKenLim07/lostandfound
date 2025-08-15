import Link from "next/link"
import { Search } from "lucide-react"
import { ReportItemLink } from "@/components/ReportItemLink"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Search className="h-3 w-3" />
              </div>
              <span className="font-semibold">Mosqueda Lost & Found</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Helping our community reconnect with lost items
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 text-sm">
            <Link href="/hall-of-fame" className="text-muted-foreground transition-colors hover:text-foreground">
              Campus Guardian
            </Link>
            <ReportItemLink className="text-muted-foreground transition-colors hover:text-foreground" />
          </div>
        </div>
        <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mosqueda Campus. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 