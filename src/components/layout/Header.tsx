"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { NavigationLinks } from "@/components/navigation/NavigationLinks"
import { MobileMenuProvider } from "@/components/navigation/MobileMenuProvider"

type HeaderProps = {
  initialIsLoggedIn: boolean
  initialIsAdmin: boolean
}

export function Header({ initialIsLoggedIn, initialIsAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Search className="h-4 w-4" />
              </div>
              <span className="hidden font-semibold sm:inline-block">Lost & Found</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <NavigationLinks initialIsLoggedIn={initialIsLoggedIn} initialIsAdmin={initialIsAdmin} />
            </div>
          </div>

          {/* Right side - Auth & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Desktop Auth */}
            <div className="hidden sm:block">
              <AuthStatus />
            </div>
            
            {/* Mobile Menu */}
            <div className="sm:hidden">
              <MobileMenuProvider initialIsLoggedIn={initialIsLoggedIn} initialIsAdmin={initialIsAdmin} />
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
} 