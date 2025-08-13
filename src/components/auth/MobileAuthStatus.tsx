"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
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
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!isMounted) return
        if (error) {
          console.error("Auth error:", error)
          setIsLoggedIn(false)
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
    
    load()
    
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      
      console.log("Auth state change:", event, !!session)
      const isNowLoggedIn = !!session
      
      setIsLoggedIn(isNowLoggedIn)
      
      // Note: Removed login redirect to keep users on current page for better UX
      // Users will stay where they are and can continue browsing
    })
    
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function signOut() {
    try {
      console.log("Starting sign out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        return
      }
      console.log("Sign out successful")
      
      // Close mobile menu after successful sign out
      if (onMobileMenuClose) {
        onMobileMenuClose()
      }
    router.push("/")
    router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
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