"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function getAllUsers() {
	const supabase = createServerActionClient<Database>({ cookies })
	
	// First check if current user is admin
	const { data: { session } } = await supabase.auth.getSession()
	if (!session) {
		throw new Error("Not authenticated")
	}
	
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", session.user.id)
		.single()
		
	if (profile?.role !== "admin") {
		throw new Error("Not authorized")
	}
	
	// Use service role client to bypass RLS
	if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
		
		// Fetch all users with service role (this will bypass RLS)
		const { data: users, error } = await supabaseAdmin
			.from("profiles")
			.select("id, full_name, role, blocked, created_at")
			.order("created_at", { ascending: false })
			.limit(100)
			
		if (error) {
			throw error
		}
		
		return users
	} else {
		// Fallback to regular client (might still be restricted by RLS)
		const { data: users, error } = await supabase
			.from("profiles")
			.select("id, full_name, role, blocked, created_at")
			.order("created_at", { ascending: false })
			.limit(100)
			
		if (error) {
			throw error
		}
		
		return users
	}
}

export async function updateUserRole(userId: string, newRole: "admin" | "user") {
	const supabase = createServerActionClient<Database>({ cookies })
	
	// First check if current user is admin
	const { data: { session } } = await supabase.auth.getSession()
	if (!session) {
		throw new Error("Not authenticated")
	}
	
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", session.user.id)
		.single()
		
	if (profile?.role !== "admin") {
		throw new Error("Not authorized")
	}
	
	// Use service role client to bypass RLS
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
	
	// Update the user's role
	const { error } = await supabaseAdmin
		.from("profiles")
		.update({ role: newRole })
		.eq("id", userId)
		
	if (error) {
		throw error
	}
	
	return { success: true }
}

export async function toggleUserBlock(userId: string, blocked: boolean) {
	const supabase = createServerActionClient<Database>({ cookies })
	
	// First check if current user is admin
	const { data: { session } } = await supabase.auth.getSession()
	if (!session) {
		throw new Error("Not authenticated")
	}
	
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", session.user.id)
		.single()
		
	if (profile?.role !== "admin") {
		throw new Error("Not authorized")
	}
	
	// Use service role client to bypass RLS
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
	
	// Update the user's blocked status
	const { error } = await supabaseAdmin
		.from("profiles")
		.update({ blocked })
		.eq("id", userId)
		
	if (error) {
		throw error
	}
	
	return { success: true }
} 