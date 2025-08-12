"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import Link from "next/link"

export function NavigationLinks() {
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
      <Link 
        href="/" 
        className="text-foreground/60 transition-colors hover:text-foreground"
      >
        Browse Items
      </Link>
      <Link 
        href="/hall-of-fame" 
        className="text-foreground/60 transition-colors hover:text-foreground"
      >
        Hall of Fame
      </Link>
      {isLoggedIn && (
        <Link 
          href="/my-items" 
          className="text-foreground/60 transition-colors hover:text-foreground"
        >
          Reports
        </Link>
      )}
    </>
  )
} 