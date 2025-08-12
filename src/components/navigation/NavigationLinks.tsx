"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import Link from "next/link"

type Props = {
  initialIsLoggedIn?: boolean
  initialIsAdmin?: boolean
}

export function NavigationLinks({ initialIsLoggedIn = false, initialIsAdmin = false }: Props) {
  const supabase = createClientComponentClient<Database>()
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadRole(userId: string) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single()
        if (!isMounted) return
        setIsAdmin(profile?.role === "admin")
      } catch {
        if (!isMounted) return
        setIsAdmin(false)
      }
    }

    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        const session = data.session
        setIsLoggedIn(!!session)
        if (session?.user?.id) {
          await loadRole(session.user.id)
        } else {
          setIsAdmin(false)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      if (session?.user?.id) {
        loadRole(session.user.id)
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

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
      {isAdmin && (
        <Link 
          href="/dashboard" 
          className="text-foreground/60 transition-colors hover:text-foreground"
        >
          Admin
        </Link>
      )}
    </>
  )
} 