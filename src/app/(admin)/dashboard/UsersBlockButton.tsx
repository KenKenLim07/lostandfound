"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toggleUserBlock } from "./actions"

export function UsersBlockButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const [blocked, setBlocked] = useState(isBlocked)
  const [isSaving, setIsSaving] = useState(false)

  async function toggleBlock() {
    setIsSaving(true)
    try {
      await toggleUserBlock(userId, !blocked)
      setBlocked(!blocked)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update block status")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant={blocked ? "default" : "destructive"} 
      onClick={toggleBlock} 
      disabled={isSaving}
      className="w-20"
    >
      {isSaving ? "Saving…" : blocked ? "Unblock" : "Block"}
    </Button>
  )
} 