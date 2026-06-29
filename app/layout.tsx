import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "AI Procurement Copilot",
  description:
    "Business procurement copilot connected to Amazon Aurora DSQL — vendor management, contract intelligence, and spend analytics.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} bg-slate-50 dark:bg-slate-950`} suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  )
}
