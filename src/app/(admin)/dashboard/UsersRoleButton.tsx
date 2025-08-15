"use client"

import { useTransition } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/system/ToastProvider"
import { ErrorHandlers } from "@/lib/errorHandling"

export function PromoteDemoteButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const supabase = createClientComponentClient<Database>()
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const isAdmin = currentRole === "admin"
  const nextRole = isAdmin ? "user" : "admin"

  function handleClick() {
    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ role: nextRole })
          .eq("id", userId)

        if (error) throw error

        // Refresh the page to show updated role
        window.location.reload()
      } catch (e) {
        ErrorHandlers.itemOperation("update", e, toast)
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Updating..." : isAdmin ? "Demote" : "Promote"}
    </Button>
  )
} 