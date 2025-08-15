import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { useMemo } from "react"

/**
 * Centralized Supabase client hook for client components
 * 
 * This hook ensures we have a single, memoized instance of the Supabase client
 * across all components, reducing bundle size and improving performance.
 * 
 * @returns Supabase client instance
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const supabase = useSupabase()
 *   
 *   const handleAction = async () => {
 *     const { data, error } = await supabase
 *       .from('items')
 *       .select('*')
 *   }
 * }
 * ```
 */
export function useSupabase() {
  return useMemo(() => createClientComponentClient<Database>(), [])
}

/**
 * Type-safe Supabase client for use in components
 */
export type SupabaseClient = ReturnType<typeof useSupabase> 