import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { data: item, error } = await supabase
      .from("items")
      .select("id, title, type, description, date, location, image_url, status, created_at, returned_party, returned_year_section, returned_at, user_id")
      .eq("id", id)
      .single()

    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch profile data if user_id exists
    let profile = null
    if (item.user_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, school_id, year_section, contact_number")
        .eq("id", item.user_id)
        .single()
      profile = profileData
    }

    // Return item with profile data
    const itemWithProfile = {
      ...item,
      profile
    }

    return NextResponse.json(itemWithProfile)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 