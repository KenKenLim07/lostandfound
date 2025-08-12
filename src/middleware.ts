import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = new URL(req.url)
  if (url.pathname.startsWith("/dashboard") && !session) {
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*"],
} 