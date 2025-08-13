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
  
  // Check if user is blocked
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("blocked")
    .eq("id", session.user.id)
    .single()
    
  if (profileError) {
    throw new Error("Failed to check user status")
  }
  
  if (profile?.blocked) {
    throw new Error("Your account has been blocked. You cannot post new items.")
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
  
  // Extract form data
  const type = formData.get("type") as string
  const title = formData.get("title") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const date = formData.get("date") as string
  const location = formData.get("location") as string
  const contactNumber = formData.get("contactNumber") as string
  const reporterYearSection = formData.get("reporterYearSection") as string
  const image_url = formData.get("image_url") as string | null
  
  // Validate required fields
  if (!type || !name) {
    throw new Error("Type and name are required")
  }
  
  // Insert the item
  const { error: insertError } = await supabaseAdmin
    .from("items")
    .insert({
      user_id: session.user.id,
      type,
      title,
      name: name || title,
      description: description || null,
      date: date || new Date().toISOString().slice(0, 10),
      location: location || null,
      contact_number: contactNumber || null,
      reporter_year_section: reporterYearSection || null,
      image_url: image_url || null,
      status: "active",
    })
    
  if (insertError) {
    throw new Error(`Failed to post item: ${insertError.message}`)
  }
  
  return { success: true }
} 