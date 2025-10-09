import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider"
import { Toaster } from "@/components/ui/toaster"

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: "ModelCast - AI Virtual Try-On for E-Commerce",
  description: "Transform your product photos into professional model shots instantly with AI",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="dark font-sans antialiased text-[17px] leading-[1.6] tracking-[0.031em]">
        <SupabaseAuthProvider>
          {children}
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
