"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isPlaceholder = (value?: string | null) =>
  !value || value.trim().length === 0 || value.includes("<") || value.includes("your_supabase")

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
}

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  throw new Error(
    "Supabase environment variables are placeholders. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with real project credentials.",
  )
}

let browserClient: ReturnType<typeof createClientComponentClient> | null = null

export const getSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createClientComponentClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[supabase] Shared client initialized once")
    }
  }

  return browserClient!
}

export type { SupabaseClient }
