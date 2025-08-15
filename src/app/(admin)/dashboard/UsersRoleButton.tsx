"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateUserRole } from "./actions"

export function PromoteDemoteButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [isSaving, setIsSaving] = useState(false)
  const isAdmin = role === "admin"

  async function toggleRole() {
    setIsSaving(true)
    try {
      const nextRole = isAdmin ? "user" : "admin"
      await updateUserRole(userId, nextRole)
      setRole(nextRole)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant={isAdmin ? "outline" : "default"} 
      onClick={toggleRole} 
      disabled={isSaving}
      className="w-32"
    >
      {isSaving ? "Saving…" : isAdmin ? "Demote to user" : "Promote to admin"}
    </Button>
  )
} 