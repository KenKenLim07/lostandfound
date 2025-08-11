import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <nav className="mx-auto max-w-7xl px-2 sm:px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-sm">
              <Link href="/" className="font-semibold hidden sm:inline-block">Home</Link>
              <Link href="/hall-of-fame" className="text-muted-foreground hover:text-foreground hidden sm:inline-block">Hall of Fame</Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <AuthStatus />
              </div>
              <div className="sm:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="icon" variant="outline" aria-label="Open menu">
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-2">
                      <SheetClose asChild>
                        <Link href="/" className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground">Home</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/hall-of-fame" className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground">Hall of Fame</Link>
                      </SheetClose>
                      <div className="pt-2 border-t mt-2">
                        <AuthStatus />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
