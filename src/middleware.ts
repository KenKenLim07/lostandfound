import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareSupabaseClient } from "@/lib/supabase-server"

export async function middleware(req: NextRequest) {
  const { supabase, response } = createMiddlewareSupabaseClient(req)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = new URL(req.url)
  if (url.pathname.startsWith("/dashboard") && !session) {
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*"],
} 