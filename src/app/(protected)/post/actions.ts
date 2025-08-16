"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function postItem(formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies })
  
  // First check if current user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error("Not authenticated")
  }
  
  // Check if user profile is complete
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("blocked, profile_complete")
    .eq("id", session.user.id)
    .single()
    
  if (profileError) {
    throw new Error("Failed to check user status")
  }
  
  if (profile?.blocked) {
    throw new Error("Your account has been blocked. You cannot post new items.")
  }
  
  if (!profile?.profile_complete) {
    throw new Error("Please complete your profile before posting items.")
  }
  
  // Use service role client for the actual posting
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Extract form data - only item-specific fields
  const type = formData.get("type") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const date = formData.get("date") as string
  const location = formData.get("location") as string
  const image_url = formData.get("image_url") as string | null
  
  // Validate required fields
  if (!type || !title) {
    throw new Error("Type and title are required")
  }
  
  // Insert the item with user_id only
  const { error: insertError } = await supabaseAdmin
    .from("items")
    .insert({
      user_id: session.user.id,
      type,
      title,
      description: description || null,
      date: date || new Date().toISOString().slice(0, 10),
      location: location || null,
      image_url: image_url || null,
      status: "active",
    })
    
  if (insertError) {
    throw new Error(`Failed to post item: ${insertError.message}`)
  }
  
  return { success: true }
} 