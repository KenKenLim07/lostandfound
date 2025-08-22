"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { CampusGuardianDialog } from "@/components/leaderboard/CampusGuardianDialog"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { PostingRulesDialog } from "@/components/posting/PostingRulesDialog"
import { ProfileSetupDialog } from "@/components/auth/ProfileSetupDialog"
import { useSupabase } from "@/hooks/useSupabase"
import { hasAgreedToPostingRules } from "@/lib/posting-rules"

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000
function readProfileCompleteCache(userId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(`profile_complete:${userId}`)
    if (!raw) return null
    const { v, ts } = JSON.parse(raw) as { v: boolean; ts: number }
    if (Date.now() - ts > PROFILE_CACHE_TTL_MS) return null
    return !!v
  } catch { return null }
}
function writeProfileCompleteCache(userId: string, value: boolean) {
  try {
    sessionStorage.setItem(`profile_complete:${userId}` , JSON.stringify({ v: !!value, ts: Date.now() }))
  } catch {}
}

export function ClientHomeHeader() {
  const supabase = useSupabase()
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [pendingPostIntent, setPendingPostIntent] = useState(false)

  async function proceedToPost() {
    try {
      const agreed = hasAgreedToPostingRules()
      if (agreed) router.push("/post")
      else setRulesOpen(true)
    } catch {
      setRulesOpen(true)
    }
  }

  async function handleReportClick() {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        const session = data.session
        const uid = session.user.id
        setUserEmail(session.user.email || "")
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("blocked, profile_complete")
          .eq("id", uid)
          .single()
        if (error) return proceedToPost()
        if (profile?.blocked) {
          alert("Your account has been blocked. You cannot post new items. Please contact an administrator if you believe this is an error.")
          return
        }
        const cached = readProfileCompleteCache(uid)
        if (cached === true) {
          proceedToPost()
          ;(async () => {
            const { data: row } = await supabase
              .from("profiles")
              .select("profile_complete")
              .eq("id", uid)
              .single()
            if (row) writeProfileCompleteCache(uid, !!row.profile_complete)
          })()
          return
        }
        if (profile?.profile_complete) {
          writeProfileCompleteCache(uid, true)
          return proceedToPost()
        }
        setPendingPostIntent(true)
        setShowProfileSetup(true)
        return
      }
      try { sessionStorage.setItem("intent_after_login", "/post") } catch {}
      setLoginOpen(true)
    } catch {
      try { sessionStorage.setItem("intent_after_login", "/post") } catch {}
      setLoginOpen(true)
    }
  }

  function handleProfileSetupComplete() {
    setShowProfileSetup(false)
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user.id
      if (uid) writeProfileCompleteCache(uid, true)
    })()
    if (pendingPostIntent) {
      setPendingPostIntent(false)
      proceedToPost()
    }
  }

  return (
    <>
      <section className="bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-12">
          <div className="text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome, Mosquedian&apos;s</h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Browse recently posted lost and found items from our campus community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <CampusGuardianDialog />
              <Button 
                onClick={handleReportClick} 
                size="default" 
                className="gap-2 px-6 py-2.5 text-base font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="h-4 w-4" />
                Report Item
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} showTrigger={false} initialMode="signin" note="Please sign in or create an account to report a lost or found item." />
      <ProfileSetupDialog open={showProfileSetup} email={userEmail} onComplete={handleProfileSetupComplete} onCancel={() => setShowProfileSetup(false)} />
      <PostingRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} onContinue={() => router.push("/post")} />
    </>
  )
} 