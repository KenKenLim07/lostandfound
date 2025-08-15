"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { useRouter } from "next/navigation"

export function ReportItemLink({ className }: { className?: string }) {
  const supabase = createClientComponentClient<Database>()
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    
    try {
      setIsChecking(true)
      const { data } = await supabase.auth.getSession()
      
      if (data.session) {
        // Check if user is blocked
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("blocked")
          .eq("id", data.session.user.id)
          .single()
        
        if (profileError) {
          console.error("Error checking user status:", profileError)
          // If we can't check, allow the user to proceed (fail open)
          router.push("/post")
          return
        }
        
        if (profile?.blocked) {
          // Show blocked message
          alert("Your account has been blocked. You cannot post new items. Please contact an administrator if you believe this is an error.")
          return
        }
        
        // User is not blocked, proceed to post page
        router.push("/post")
      } else {
        // Not logged in, redirect to post page (will show login dialog)
        router.push("/post")
      }
    } catch (error) {
      console.error("Error checking user status:", error)
      // If there's an error, allow the user to proceed (fail open)
      router.push("/post")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isChecking}
      className={className}
    >
      {isChecking ? "Checking..." : "Report Item"}
    </button>
  )
} 