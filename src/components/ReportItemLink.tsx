"use client"

import { useState } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/system/ToastProvider"
import { ErrorHandlers } from "@/lib/errorHandling"

export function ReportItemLink({ className }: { className?: string }) {
  const supabase = useSupabase()
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()
  const toast = useToast()

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
          ErrorHandlers.permission(new Error("Account blocked"), toast)
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