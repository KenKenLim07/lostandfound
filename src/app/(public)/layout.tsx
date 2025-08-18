import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mosqueda Lost & Found - Find Lost Items | GSU Campus",
  description: "Find lost items and report found belongings at Guimaras State University Mosqueda Campus. Our secure Lost & Found platform helps students, faculty, and staff reconnect with their items.",
  keywords: [
    "lost items",
    "found belongings", 
    "GSU Mosqueda",
    "campus lost and found",
    "item recovery",
    "Guimaras State University"
  ],
  openGraph: {
    title: "Mosqueda Lost & Found - Find Lost Items | GSU Campus",
    description: "Find lost items and report found belongings at Guimaras State University Mosqueda Campus",
    url: "https://lost-and-found-liart.vercel.app",
    type: "website",
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 