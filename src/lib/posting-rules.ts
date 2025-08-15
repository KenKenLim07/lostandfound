const RULES_AGREEMENT_KEY = "posting_rules_agreed"

/**
 * Check if the user has agreed to the posting rules
 */
export function hasAgreedToPostingRules(): boolean {
  try {
    if (typeof window === "undefined") return false
    return localStorage.getItem(RULES_AGREEMENT_KEY) === "true"
  } catch (error) {
    console.warn("Failed to check posting rules agreement:", error)
    return false
  }
}

/**
 * Mark that the user has agreed to the posting rules
 */
export function markPostingRulesAgreed(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem(RULES_AGREEMENT_KEY, "true")
  } catch (error) {
    console.warn("Failed to save posting rules agreement:", error)
  }
}

/**
 * Reset the user's posting rules agreement
 */
export function resetPostingRulesAgreement(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem(RULES_AGREEMENT_KEY)
  } catch (error) {
    console.warn("Failed to reset posting rules agreement:", error)
  }
} 