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
  const prevSignedInRef = useRef<boolean>(false)

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
        // ignore
      }
    }

    primePrevState()

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const now = Date.now()
      if (now - lastEventAtRef.current < 500) return
      lastEventAtRef.current = now

      const isSignedIn = !!session

      // Ignore non-UX events
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED" || event === "PASSWORD_RECOVERY") {
        prevSignedInRef.current = isSignedIn
        return
      }

      if (event === "SIGNED_IN") {
        if (prevSignedInRef.current) {
          // Already signed in previously; avoid showing on tab focus/init
          prevSignedInRef.current = true
          return
        }
        prevSignedInRef.current = true
        setVariant("in")
        setMessage("Signing you in…")
        setVisible(true)
      } else if (event === "SIGNED_OUT") {
        if (!prevSignedInRef.current) {
          // Already signed out; avoid duplicate
          prevSignedInRef.current = false
          return
        }
        prevSignedInRef.current = false
        setVariant("out")
        setMessage("Signing you out…")
        setVisible(true)
      }

      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 1200)
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
          <span>{message}</span>
        </div>
      </div>
    </div>
  )
} 