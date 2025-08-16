"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import Link from "next/link"

type Props = {
  initialIsLoggedIn?: boolean
  initialIsAdmin?: boolean
}

export function NavigationLinks({ initialIsLoggedIn = false, initialIsAdmin = false }: Props) {
  const supabase = useSupabase()
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin)

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
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        const session = data.session
        setIsLoggedIn(!!session)
        if (session?.user?.id) {
          await loadRole(session.user.id)
        } else {
          setIsAdmin(false)
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
        Campus Guardian
      </Link>
      {isLoggedIn && (
        <Link 
          href="/my-items" 
          className="text-foreground/60 transition-colors hover:text-foreground"
        >
          My Reports
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