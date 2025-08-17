"use client"

import { useEffect, useState } from "react"
import { useProfileCompletion } from "@/hooks/useProfileCompletion"
import { ProfileSetupDialog } from "@/components/auth/ProfileSetupDialog"
import { useSupabase } from "@/hooks/useSupabase"
import { Loader2 } from "lucide-react"

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
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const supabase = useSupabase()

  useEffect(() => {
    // Get user email from session
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    getUserEmail()
  }, [supabase.auth])

  useEffect(() => {
    // Show profile setup if profile is not complete and not loading
    if (!loading && !isProfileComplete && requireProfile) {
      setShowProfileSetup(true)
    }
  }, [isProfileComplete, loading, requireProfile])

  const handleProfileComplete = () => {
    setShowProfileSetup(false)
    refreshProfile()
  }

  const handleProfileCancel = () => {
    setShowProfileSetup(false)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load profile</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Show profile setup dialog
  if (showProfileSetup) {
    return (
      <>
        <ProfileSetupDialog 
          open={showProfileSetup}
          email={userEmail}
          onComplete={handleProfileComplete}
          onCancel={handleProfileCancel}
        />
        {fallback || (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Please complete your profile to continue</p>
            </div>
          </div>
        )}
      </>
    )
  }

  // Show children if profile is complete or not required
  return <>{children}</>
} 