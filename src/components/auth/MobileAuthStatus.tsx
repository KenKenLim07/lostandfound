"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { useRouter } from "next/navigation"
import { SheetClose } from "@/components/ui/sheet"

export function MobileAuthStatus() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setIsLoading(false)
      setIsLoggedIn(!!data.session)
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (isLoading) return <div className="text-xs text-muted-foreground">…</div>

  if (!isLoggedIn) return <LoginDialog isMobileMenu={true} />

  return (
    <SheetClose asChild>
      <Button variant="outline" size="sm" onClick={signOut} className="w-full">
        Sign out
      </Button>
    </SheetClose>
  )
} 