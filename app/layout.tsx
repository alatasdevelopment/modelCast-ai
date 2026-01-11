import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import "./globals.css"
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ModelCast",
  applicationCategory: "PhotographyApplication",
  operatingSystem: "Web",
  url: "https://modelcast.fit",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial with 2 credits",
  },
}

export const metadata: Metadata = {
  metadataBase: new URL("https://modelcast.fit"),
  title: {
    default: "ModelCast – AI Fashion Model Generator",
    template: "%s | ModelCast",
  },
  description:
    "Generate professional model photos for your fashion products instantly with AI. No photoshoots, no hassle — just upload your product image and get HD model visuals in seconds.",
  keywords: [
    "AI fashion model generator",
    "AI virtual try-on",
    "AI photoshoot",
    "product photography generator",
    "AI model photo app",
    "ModelCast",
  ],
  openGraph: {
    title: "ModelCast – AI Model Photo Generator",
    description:
      "Turn your product images into professional model photos in seconds. Perfect for e-commerce and fashion creators.",
    url: "https://modelcast.fit",
    siteName: "ModelCast",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ModelCast AI generated model image preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@modelcast",
    title: "ModelCast – AI Model Generator",
    description:
      "AI tool to generate professional model photos for your products. Try free with 2 credits.",
    images: ["/twitter-image"],
  },
  alternates: {
    canonical: "https://modelcast.fit",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <Script
          src="https://plausible.io/js/script.js"
          data-domain="modelcast.fit"
          strategy="lazyOnload"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      </head>
      <body className={`dark ${inter.className} antialiased text-[17px] leading-[1.6] tracking-[0.02em]`}>
        <SupabaseAuthProvider>
          {children}
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
