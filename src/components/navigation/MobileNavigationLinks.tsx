"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import Link from "next/link"
import { SheetClose } from "@/components/ui/sheet"

type Props = {
  initialIsLoggedIn?: boolean
  initialIsAdmin?: boolean
}

export function MobileNavigationLinks({ initialIsLoggedIn = false, initialIsAdmin = false }: Props) {
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
          Campus Guardian
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
      {isAdmin && (
        <SheetClose asChild>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Admin
          </Link>
        </SheetClose>
      )}
    </>
  )
} 