"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { MobileNavigationLinks } from "@/components/navigation/MobileNavigationLinks"
import { MobileAuthStatus } from "@/components/auth/MobileAuthStatus"

type Props = {
  initialIsLoggedIn: boolean
  initialIsAdmin: boolean
}

export function MobileMenuProvider({ initialIsLoggedIn, initialIsAdmin }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px] sm:w-[400px]">
        {/* Accessible title (visually hidden) */}
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-end border-b pb-2">
          <SheetClose asChild>
            <Button size="icon" variant="ghost" aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>
        <div className="flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-2">
            <MobileNavigationLinks initialIsLoggedIn={initialIsLoggedIn} initialIsAdmin={initialIsAdmin} />
          </div>
          <div className="border-t pt-4">
            <MobileAuthStatus onMobileMenuClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 