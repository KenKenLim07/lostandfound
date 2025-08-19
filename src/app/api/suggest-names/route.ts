import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const q = (searchParams.get("q") || "").trim()
		if (q.length < 2) {
			return NextResponse.json({ suggestions: [] })
		}

		const url = process.env.NEXT_PUBLIC_SUPABASE_URL
		const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		if (!url) {
			return NextResponse.json({ suggestions: [] }, { status: 200 })
		}

		if (!serviceKey) {
			// Service key not configured. Return empty to avoid RLS issues.
			return NextResponse.json({ suggestions: [] }, { status: 200 })
		}

		const supabase = createClient(url, serviceKey, {
			auth: { autoRefreshToken: false, persistSession: false }
		})

		const { data, error } = await supabase
			.from("profiles")
			.select("full_name, year_section")
			.ilike("full_name", `%${q}%`)
			.limit(8)

		if (error) {
			return NextResponse.json({ suggestions: [] }, { status: 200 })
		}

		const suggestions = (data || [])
			.map((p) => ({
				name: (p.full_name as string) || "",
				year_section: (p.year_section as string) || null,
			}))
			.filter((s) => s.name)

		return NextResponse.json({ suggestions })
	} catch {
		return NextResponse.json({ suggestions: [] }, { status: 200 })
	}
} 