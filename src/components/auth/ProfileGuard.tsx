"use client"

import { useEffect, useState } from "react"
import { useProfileCompletion } from "@/hooks/useProfileCompletion"
import { ProfileSetupDialog } from "@/components/auth/ProfileSetupDialog"
import { useSupabase } from "@/hooks/useSupabase"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export type ProfileGuardProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireProfile?: boolean
}

export function ProfileGuard({ 
  children, 
  fallback,
  requireProfile = true 
}: ProfileGuardProps) {
  const { isProfileComplete, loading, error, refreshProfile } = useProfileCompletion()
  const [userEmail, setUserEmail] = useState<string>("")
  const [setupDismissed, setSetupDismissed] = useState(false)
  const supabase = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) setUserEmail(session.user.email)
    }
    getUserEmail()
  }, [supabase.auth])

  const handleProfileComplete = () => {
    setSetupDismissed(false)
    setTimeout(() => {
    refreshProfile()
    }, 100)
  }

  // Loading state (prefer provided fallback over spinner)
  if (loading) {
    return (
      <>{fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking profile...</span>
          </div>
        </div>
      )}</>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to check profile</p>
          <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline">Try again</button>
        </div>
      </div>
    )
  }

  // Gate: if profile is required and incomplete, block children
  if (requireProfile && !isProfileComplete) {
    return (
      <>
        {!setupDismissed && (
        <ProfileSetupDialog 
            open={true}
          email={userEmail}
          onComplete={handleProfileComplete}
            onCancel={() => {
              setSetupDismissed(true)
              router.replace("/")
            }}
        />
        )}
        {fallback || (
          <div className="flex items-center justify-center min-h-[200px] p-6">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">Please complete your profile to continue</p>
              {setupDismissed && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setSetupDismissed(false)}
                >
                  Reopen profile setup
                </button>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // Otherwise, show children
  return <>{children}</>
} 