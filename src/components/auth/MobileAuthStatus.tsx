"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import { Button } from "@/components/ui/button"
import { SheetClose } from "@/components/ui/sheet"
import { LogOut } from "lucide-react"
import { LoginDialog } from "@/components/auth/LoginDialog"

type Props = {
  initialIsLoggedIn?: boolean
}

export function MobileAuthStatus({ initialIsLoggedIn = false }: Props) {
  const supabase = useSupabase()
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)
  const [email, setEmail] = useState<string | null>(null)

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
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (!isLoggedIn) {
    return (
      <LoginDialog 
        isMobileMenu={true}
        showTrigger={false}
        initialMode="signin"
        note="Sign in to access your reports and post items."
      />
    )
  }

  return (
    <>
      <div className="px-3 py-2 text-sm text-muted-foreground border-b">
        {email}
      </div>
      <SheetClose asChild>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </SheetClose>
    </>
  )
} 