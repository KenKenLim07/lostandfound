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
  title: "Mosqueda Lost & Found - GSU Campus Item Recovery System",
  description: "Official Lost & Found platform for Guimaras State University Mosqueda Campus. Find lost items, report found belongings, and help our CST community reconnect. Serving students, faculty, and staff with secure item recovery.",
  keywords: [
    "lost and found",
    "GSU Mosqueda Campus",
    "Guimaras State University",
    "CST campus",
    "item recovery",
    "lost items",
    "found belongings",
    "campus lost and found",
    "Mosqueda campus",
    "Philippines lost and found"
  ],
  authors: [{ name: "GSU Mosqueda Campus" }],
  creator: "GSU Mosqueda Campus",
  publisher: "Guimaras State University",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lost-and-found-liart.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Mosqueda Lost & Found - GSU Campus Item Recovery",
    description: "Official Lost & Found platform for Guimaras State University Mosqueda Campus. Find lost items, report found belongings, and help our CST community reconnect.",
    url: 'https://lost-and-found-liart.vercel.app',
    siteName: 'Mosqueda Lost & Found',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Mosqueda Lost & Found - GSU Campus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Mosqueda Lost & Found - GSU Campus Item Recovery",
    description: "Official Lost & Found platform for Guimaras State University Mosqueda Campus",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add this when you get it from Google Search Console
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Mosqueda Lost & Found" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lost & Found" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0f172a" />
        
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
        <link rel="mask-icon" href="/icon-192.png" color="#0f172a" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Mosqueda Lost & Found",
              "description": "Official Lost & Found platform for Guimaras State University Mosqueda Campus",
              "url": "https://lost-and-found-liart.vercel.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://lost-and-found-liart.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Guimaras State University",
                "url": "https://www.gsu.edu.ph",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Mosqueda",
                  "addressRegion": "Guimaras",
                  "addressCountry": "PH"
                }
              }
            })
          }}
        />
      </head>
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
