"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import Link from "next/link"
import { SheetClose } from "@/components/ui/sheet"

export function MobileNavigationLinks() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
        const { data } = await supabase.auth.getSession()
        setIsLoggedIn(!!data.session)
      } catch {
        setIsLoggedIn(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return null
  }

  return (
    <>
      <SheetClose asChild>
        <Link 
          href="/" 
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Home
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link 
          href="/hall-of-fame" 
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Hall of Fame
        </Link>
      </SheetClose>
      {isLoggedIn && (
        <SheetClose asChild>
          <Link 
            href="/my-items" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Reports
          </Link>
        </SheetClose>
      )}
    </>
  )
} 