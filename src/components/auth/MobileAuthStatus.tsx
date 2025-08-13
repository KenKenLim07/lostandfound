"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { SheetClose } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

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
      
      const isNowLoggedIn = !!session
      
      setIsLoggedIn(isNowLoggedIn)
      
      // Note: Removed login redirect to keep users on current page for better UX
      // Users will stay where they are and can continue browsing
    })
    
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase, isLoggedIn])

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