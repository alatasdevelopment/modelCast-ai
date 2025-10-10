import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

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
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`dark ${inter.className} antialiased text-[17px] leading-[1.6] tracking-[0.02em]`}>
        <SupabaseAuthProvider>
          {children}
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
