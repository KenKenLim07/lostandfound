"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import type { Tables } from "@/types/database"

export type Profile = Tables<"profiles">

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
function readProfileCompleteCache(userId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(`profile_complete:${userId}`)
    if (!raw) return null
    const { v, ts } = JSON.parse(raw) as { v: boolean; ts: number }
    if (Date.now() - ts > PROFILE_CACHE_TTL_MS) return null
    return !!v
  } catch {
    return null
  }
}
function writeProfileCompleteCache(userId: string, value: boolean) {
  try {
    sessionStorage.setItem(`profile_complete:${userId}`, JSON.stringify({ v: !!value, ts: Date.now() }))
  } catch {}
}

export function useProfileCompletion() {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Partial<Profile> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = useSupabase()

  useEffect(() => {
    let cancelled = false

    async function backgroundRevalidate(userId: string) {
      try {
        const { data: row, error } = await supabase
          .from('profiles')
          .select('profile_complete')
          .eq('id', userId)
          .single()
        if (cancelled) return
        if (!error && row) {
          const complete = !!(row as { profile_complete: boolean | null }).profile_complete
          setProfile(row as Partial<Profile>)
          setIsProfileComplete(complete)
          writeProfileCompleteCache(userId, complete)
        }
      } catch {}
    }

    async function checkProfile() {
      try {
        setError(null)
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        
        if (!session) {
          setIsProfileComplete(false)
          setProfile(null)
          setLoading(false)
          return
        }
        const userId = session.user.id
        // Fast path from cache
        const cached = readProfileCompleteCache(userId)
        if (cached === true) {
          setIsProfileComplete(true)
          setLoading(false)
          // background revalidate without blocking
          backgroundRevalidate(userId)
          return
        }
        // No cache or false → do lightweight fetch and block
        setLoading(true)
        const { data: row, error: profileError } = await supabase
          .from('profiles')
          .select('profile_complete')
          .eq('id', userId)
          .single()
        if (cancelled) return
        if (profileError) {
          console.error('Profile fetch error:', profileError)
          setError('Failed to load profile')
          setIsProfileComplete(false)
          setLoading(false)
          return
        }
        setProfile(row as Partial<Profile>)
        const complete = !!(row as { profile_complete: boolean | null } | null)?.profile_complete
        setIsProfileComplete(complete)
        writeProfileCompleteCache(userId, complete)
      } catch (err) {
        console.error('Profile completion check error:', err)
        setError('Failed to check profile status')
        setIsProfileComplete(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    checkProfile()
    return () => { cancelled = true }
  }, [supabase])

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const userId = session.user.id
      const { data: row, error } = await supabase
        .from('profiles')
        .select('profile_complete')
        .eq('id', userId)
        .single()
      if (!error && row) {
        setProfile(row as Partial<Profile>)
        const complete = !!(row as { profile_complete: boolean | null }).profile_complete
        setIsProfileComplete(complete)
        writeProfileCompleteCache(userId, complete)
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