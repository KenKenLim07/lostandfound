"use client"

import { useCallback } from "react"

export type ItemStatusChangeEvent = {
  itemId: string
  newStatus: string
  timestamp: number
}

export function useRealTimeUpdates() {
  const notifyItemStatusChange = useCallback((itemId: string, newStatus: string) => {
    const event = new CustomEvent("itemStatusChanged", {
      detail: {
        itemId,
        newStatus,
        timestamp: Date.now()
      }
    })
    window.dispatchEvent(event)
  }, [])

  const invalidateCaches = useCallback(() => {
    try {
      // Invalidate all related caches
      sessionStorage.removeItem("leaderboard_v1")
      sessionStorage.removeItem("home_items_v1")
      
      // Clear any other related caches
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.includes("items") || key.includes("leaderboard")) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Failed to invalidate caches:", error)
    }
  }, [])

  const refreshData = useCallback(async () => {
    // Force refresh of admin dashboard if it's open
    if (window.location.pathname.includes("/dashboard")) {
      window.location.reload()
    }
  }, [])

  return {
    notifyItemStatusChange,
    invalidateCaches,
    refreshData
  }
} 