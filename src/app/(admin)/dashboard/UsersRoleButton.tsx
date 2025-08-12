"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"

export function PromoteDemoteButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const supabase = createClientComponentClient<Database>()
  const [role, setRole] = useState(currentRole)
  const [isSaving, setIsSaving] = useState(false)
  const isAdmin = role === "admin"

  async function toggleRole() {
    setIsSaving(true)
    try {
      const nextRole = isAdmin ? "user" : "admin"
      const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", userId)
      if (error) throw error
      setRole(nextRole)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button size="sm" variant={isAdmin ? "outline" : "default"} onClick={toggleRole} disabled={isSaving}>
      {isSaving ? "Saving…" : isAdmin ? "Demote to user" : "Promote to admin"}
    </Button>
  )
} 