import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const supabase = createServerComponentClient<Database>({ cookies })

	const {
		data: { session },
	} = await supabase.auth.getSession()
	if (!session) redirect("/")

	// Enforce block at the server level so users cannot access /post directly
	const { data: profile } = await supabase
		.from("profiles")
		.select("blocked")
		.eq("id", session.user.id)
		.single()

	if (profile?.blocked) {
		redirect("/?blocked=true")
	}

	return <>{children}</>
} 