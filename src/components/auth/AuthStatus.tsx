"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"

export function AuthStatus() {
  const supabase = createClientComponentClient<Database>()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      const session = data.session
      setIsLoggedIn(!!session)
      setEmail(session?.user?.email ?? null)
      setIsLoading(false)
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setEmail(session?.user?.email ?? null)
    })
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
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