import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { NavigationLinks } from "@/components/navigation/NavigationLinks";
import { Search } from "lucide-react";
import { TopLoader } from "@/components/system/TopLoader";
import { AuthEventBanner } from "@/components/system/AuthEventBanner";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";
import { ReportItemLink } from "@/components/ReportItemLink";
import { MobileMenuProvider } from "@/components/navigation/MobileMenuProvider";
import { FooterRulesReset } from "@/components/ui/footer-rules-reset";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mosqueda Lost & Found",
  description: "Lost & Found app for Mosqueda Campus",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerComponentClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let initialIsAdmin = false;
  if (session?.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    initialIsAdmin = profile?.role === "admin";
  }
  const initialIsLoggedIn = !!session;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}>
        {/* Global top loading bar */}
        <TopLoader />
        {/* Auth banners on sign in/out */}
        <AuthEventBanner />
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6">
            <nav className="flex h-16 items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Search className="h-4 w-4" />
                  </div>
                  <span className="hidden font-semibold sm:inline-block">Lost & Found</span>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <NavigationLinks initialIsLoggedIn={initialIsLoggedIn} initialIsAdmin={initialIsAdmin} />
                </div>
              </div>

              {/* Right side - Auth & Mobile Menu */}
              <div className="flex items-center gap-4">
                {/* Desktop Auth */}
                <div className="hidden sm:block">
                  <AuthStatus />
                </div>
                
                {/* Mobile Menu */}
                <div className="sm:hidden">
                  <MobileMenuProvider initialIsLoggedIn={initialIsLoggedIn} initialIsAdmin={initialIsAdmin} />
                </div>
              </div>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
        {children}
        </main>
        <footer className="border-t bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                    <Search className="h-3 w-3" />
                  </div>
                  <span className="font-semibold">Mosqueda Lost & Found</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Helping our community reconnect with lost items
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 text-sm">
                <Link href="/hall-of-fame" className="text-muted-foreground transition-colors hover:text-foreground">
                  Campus Guardian
                </Link>
                <ReportItemLink className="text-muted-foreground transition-colors hover:text-foreground" />
              </div>
            </div>
            <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mosqueda Campus. All rights reserved.{" "}
              <FooterRulesReset />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
