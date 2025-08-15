"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { useRouter } from "next/navigation"

export function AuthStatus() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    async function load() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!isMounted) return
        
        if (error) {
          // Handle AuthSessionMissingError gracefully
          if (error.message === 'Auth session missing!') {
            setIsLoggedIn(false)
            setEmail(null)
          } else {
          console.error("Auth error:", error)
          setIsLoggedIn(false)
          setEmail(null)
          }
        } else {
          setIsLoggedIn(!!user)
          setEmail(user?.email ?? null)
        }
        setIsLoading(false)
      } catch (error) {
      if (!isMounted) return
        console.error("Load error:", error)
        setIsLoggedIn(false)
        setEmail(null)
      setIsLoading(false)
      }
    }
    
    load()
    
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      
      console.log("Auth state change:", event, !!session)
      const isNowLoggedIn = !!session
      
      setIsLoggedIn(isNowLoggedIn)
      setEmail(session?.user?.email ?? null)
      
      // Note: Removed login redirect to keep users on current page for better UX
      // Users will stay where they are and can continue browsing
    })
    
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSignOut() {
    try {
      console.log("Starting sign out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        return
      }
      console.log("Sign out successful")
    router.push("/")
    router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">…</div>
  }

  if (!isLoggedIn) {
    return <LoginDialog />
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs sm:text-sm text-green-600">Logged in{email ? ` as ${email}` : ""}</span>
      <Button size="sm" variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  )
} 