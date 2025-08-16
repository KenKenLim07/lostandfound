"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import type { Tables } from "@/types/database"

export type Profile = Tables<"profiles">

export function useProfileCompletion() {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = useSupabase()

  useEffect(() => {
    async function checkProfile() {
      try {
        setLoading(true)
        setError(null)
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsProfileComplete(false)
          setProfile(null)
          return
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (profileError) {
          console.error('Profile fetch error:', profileError)
          setError('Failed to load profile')
          setIsProfileComplete(false)
          return
        }
        
        setProfile(profile)
        setIsProfileComplete(profile?.profile_complete || false)
        
      } catch (err) {
        console.error('Profile completion check error:', err)
        setError('Failed to check profile status')
        setIsProfileComplete(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkProfile()
  }, [supabase])

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (!error && profile) {
        setProfile(profile)
        setIsProfileComplete(profile.profile_complete || false)
      }
    } catch (err) {
      console.error('Profile refresh error:', err)
    }
  }

  return { 
    isProfileComplete, 
    profile, 
    loading, 
    error, 
    refreshProfile 
  }
} 