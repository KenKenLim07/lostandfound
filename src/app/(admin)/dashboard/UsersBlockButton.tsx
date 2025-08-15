"use client"

import { useTransition } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/system/ToastProvider"
import { ErrorHandlers } from "@/lib/errorHandling"

export function UsersBlockButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const supabase = createClientComponentClient<Database>()
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const nextBlocked = !isBlocked

  function handleClick() {
    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ blocked: nextBlocked })
          .eq("id", userId)

        if (error) throw error

        // Refresh the page to show updated status
        window.location.reload()
      } catch (e) {
        ErrorHandlers.itemOperation("update", e, toast)
      }
    })
  }

  return (
    <Button
      size="sm"
      variant={isBlocked ? "default" : "destructive"}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Updating..." : isBlocked ? "Unblock" : "Block"}
    </Button>
  )
} 