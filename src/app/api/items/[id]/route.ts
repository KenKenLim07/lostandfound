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

    const { data, error } = await supabase
      .from("items")
      .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at, returned_party, returned_year_section, returned_at, reporter_year_section")
      .eq("id", id)
      .single()

    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 