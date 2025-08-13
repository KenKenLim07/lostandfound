"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { useRouter } from "next/navigation"
import { SheetClose } from "@/components/ui/sheet"

type Props = {
  onMobileMenuClose?: () => void
}

export function MobileAuthStatus({ onMobileMenuClose }: Props) {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    async function load() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        setIsLoggedIn(!!data.session)
        setIsLoading(false)
      } catch (error) {
        if (!isMounted) return
        setIsLoggedIn(false)
        setIsLoading(false)
      }
    }
    
    load()
    
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      
      const wasLoggedIn = isLoggedIn
      const isNowLoggedIn = !!session
      
      setIsLoggedIn(isNowLoggedIn)
      
      // Handle login redirect - only if we weren't logged in before but are now
      if (!wasLoggedIn && isNowLoggedIn && event === "SIGNED_IN") {
        const intent = typeof window !== "undefined" ? sessionStorage.getItem("intent_after_login") : null
        if (intent) {
          try { sessionStorage.removeItem("intent_after_login") } catch {}
          router.push(intent)
        } else {
          router.push("/")
          router.refresh()
        }
      }
    })
    
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase, router, isLoggedIn])

  async function signOut() {
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (isLoading) return <div className="text-xs text-muted-foreground">…</div>

  if (!isLoggedIn) return <LoginDialog isMobileMenu={true} onMobileMenuClose={onMobileMenuClose} />

  return (
    <SheetClose asChild>
      <Button variant="outline" size="sm" onClick={signOut} className="w-full">
        Sign out
      </Button>
    </SheetClose>
  )
} 