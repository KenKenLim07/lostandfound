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
          router.push("/post")
          return
        }
        
        if (profile?.blocked) {
          alert("Your account has been blocked. You cannot post new items. Please contact an administrator if you believe this is an error.")
          return
        }
        
        router.push("/post")
      } else {
        router.push("/post")
      }
    } catch (error) {
      console.error("Error checking user status:", error)
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