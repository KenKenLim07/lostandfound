import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

// Create a single, global Supabase client instance
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Centralized Supabase client hook for client components
 * 
 * This hook ensures we have a single, global instance of the Supabase client
 * across all components, preventing duplicate authentication sessions and duplicate user accounts.
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
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>()
  }
  return supabaseClient
}

/**
 * Type-safe Supabase client for use in components
 */
export type SupabaseClient = ReturnType<typeof useSupabase> 