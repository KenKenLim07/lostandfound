"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { LoginDialog } from "@/components/auth/LoginDialog"

export function AuthStatus() {
  const supabase = useSupabase()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        const session = data.session
        setIsLoggedIn(!!session)
        setEmail(session?.user?.email ?? null)
      } catch (error) {
        if (error instanceof Error && error.message === 'Auth session missing!') {
          setIsLoggedIn(false)
          setEmail(null)
        } else {
          console.error("Auth error:", error)
          setIsLoggedIn(false)
          setEmail(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    
    init()
    
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      setIsLoggedIn(!!session)
      setEmail(session?.user?.email ?? null)
    })
    
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSignOut() {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <LoginDialog 
        showTrigger={true}
        initialMode="signin"
        note="Sign in to access your reports, profile, and post items."
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{email}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoading}
        className="h-8 px-2"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
} 