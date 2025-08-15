"use client"

import { resetPostingRulesAgreement } from "@/lib/posting-rules"

export function FooterRulesReset() {
  const handleResetRules = () => {
    try {
      resetPostingRulesAgreement()
      alert("Posting rules agreement reset. You'll see the rules again next time you report an item.")
    } catch (error) {
      console.warn("Failed to reset rules agreement:", error)
    }
  }

  return (
    <button 
      onClick={handleResetRules}
      className="text-xs text-muted-foreground/70 hover:text-muted-foreground underline underline-offset-2"
    >
      Review posting rules
    </button>
  )
} 