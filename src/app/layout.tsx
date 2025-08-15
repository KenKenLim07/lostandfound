import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TopLoader } from "@/components/system/TopLoader"
import { ToastProvider } from "@/components/system/ToastProvider"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lost & Found - Mosqueda Campus",
  description: "Find your lost items or report found items on campus.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  
  // Check if user is blocked and redirect if necessary
  let initialIsLoggedIn = false
  let initialIsAdmin = false
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      initialIsLoggedIn = true
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("blocked, role")
        .eq("id", session.user.id)
        .single()
      
      if (profile?.blocked) {
        // Sign out blocked users
        await supabase.auth.signOut()
        redirect("/")
      }
      
      initialIsAdmin = profile?.role === "admin"
    }
  } catch (error) {
    // Silently handle errors in layout
    console.error("Layout auth check error:", error)
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <TopLoader />
        <ToastProvider>
          <Header initialIsLoggedIn={initialIsLoggedIn} initialIsAdmin={initialIsAdmin} />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}
