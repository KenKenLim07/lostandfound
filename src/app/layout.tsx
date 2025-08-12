import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { NavigationLinks } from "@/components/navigation/NavigationLinks";
import { MobileNavigationLinks } from "@/components/navigation/MobileNavigationLinks";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, X } from "lucide-react";
import { TopLoader } from "@/components/system/TopLoader";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}>
        {/* Global top loading bar */}
        <TopLoader />
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
                  <NavigationLinks />
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
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Open menu">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[300px] sm:w-[400px]">
                      <div className="flex items-center justify-end border-b pb-2">
                        <SheetClose asChild>
                          <Button size="icon" variant="ghost" aria-label="Close menu">
                            <X className="h-5 w-5" />
                          </Button>
                        </SheetClose>
                      </div>
                      <div className="flex flex-col gap-4 py-6">
                        <div className="flex flex-col gap-2">
                          <MobileNavigationLinks />
                        </div>
                        <div className="border-t pt-4">
                          <AuthStatus />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
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
                  Hall of Fame
                </Link>
                <Link href="/post" className="text-muted-foreground transition-colors hover:text-foreground">
                  Report Item
                </Link>
              </div>
            </div>
            <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mosqueda Campus. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
