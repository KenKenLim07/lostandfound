"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { useRouter } from "next/navigation"

type Props = {
  onMobileMenuClose?: () => void
  initialIsLoggedIn?: boolean
}

export function MobileAuthStatus({ onMobileMenuClose, initialIsLoggedIn }: Props) {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialIsLoggedIn === undefined)
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialIsLoggedIn)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!isMounted) return

        if (error) {
          if (error.message === 'Auth session missing!') {
            setIsLoggedIn(false)
          } else {
            console.error("Auth error:", error)
            setIsLoggedIn(false)
          }
        } else {
          setIsLoggedIn(!!user)
        }
        setIsLoading(false)
      } catch (error) {
        if (!isMounted) return
        console.error("Load error:", error)
        setIsLoggedIn(false)
        setIsLoading(false)
      }
    }

    // If server provided an initial state, skip the initial network fetch
    if (initialIsLoggedIn === undefined) {
      load()
    } else {
      setIsLoading(false)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      setIsLoggedIn(!!session)
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase, initialIsLoggedIn])

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        return
      }
      if (onMobileMenuClose) {
        onMobileMenuClose()
      }
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Sign out error", error)
    }
  }

  if (isLoading) return <div className="text-xs text-muted-foreground">…</div>

  if (!isLoggedIn) return <LoginDialog isMobileMenu={true} onMobileMenuClose={onMobileMenuClose} />

  return (
      <Button variant="outline" size="sm" onClick={signOut} className="w-full">
        Sign out
      </Button>
  )
} 