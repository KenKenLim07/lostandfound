"use client"

import { useEffect, useRef, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { CheckCircle, LogOut } from "lucide-react"

export function AuthEventBanner() {
  const supabase = createClientComponentClient<Database>()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [variant, setVariant] = useState<"in" | "out">("in")
  const hideTimerRef = useRef<number | null>(null)
  const lastEventAtRef = useRef<number>(0)
  const prevSignedInRef = useRef<boolean | null>(null)

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function primePrevState() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        prevSignedInRef.current = !!data.session
      } catch {
        if (!isMounted) return
        prevSignedInRef.current = false
      }
    }

    primePrevState()

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      
      const now = Date.now()
      if (now - lastEventAtRef.current < 300) return // Reduced debounce time
      lastEventAtRef.current = now

      const isSignedIn = !!session

      // Ignore non-UX events
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED" || event === "PASSWORD_RECOVERY") {
        prevSignedInRef.current = isSignedIn
        return
      }

      if (event === "SIGNED_IN") {
        // Only show if we were previously signed out or null
        if (prevSignedInRef.current === false || prevSignedInRef.current === null) {
          prevSignedInRef.current = true
          setVariant("in")
          setMessage("Signed in successfully!")
          setVisible(true)
        }
      } else if (event === "SIGNED_OUT") {
        // Only show if we were previously signed in
        if (prevSignedInRef.current === true) {
          prevSignedInRef.current = false
          setVariant("out")
          setMessage("Signed out successfully!")
          setVisible(true)
        }
      }

      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 2000) // Increased display time
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[10000] flex justify-center px-4">
      <div
        className={
          "transition-all duration-300 ease-out " +
          (visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2")
        }
      >
        <div
          className={
            "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm shadow-sm " +
            (variant === "in"
              ? "border-green-600/30 bg-white/90 text-green-700 dark:bg-neutral-900/90"
              : "border-amber-600/30 bg-white/90 text-amber-700 dark:bg-neutral-900/90")
          }
        >
          {variant === "in" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {message}
        </div>
      </div>
    </div>
  )
} 