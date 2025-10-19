import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const adminClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

export async function POST() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[billing] missing Supabase configuration")
    return NextResponse.json({ success: false, error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    console.warn("[billing] grant-free requires authentication", sessionError)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits, is_pro")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("[billing] failed to load profile before granting free credits", profileError)
    return NextResponse.json({ success: false, error: "PROFILE_LOOKUP_FAILED" }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ success: false, error: "PROFILE_NOT_FOUND" }, { status: 404 })
  }

  if (profile.is_pro) {
    return NextResponse.json(
      { success: false, error: "Pro members already have unlimited access to non-watermarked generations." },
      { status: 400 },
    )
  }

  const currentCredits = typeof profile.credits === "number" ? profile.credits : 0
  if (currentCredits >= 2) {
    return NextResponse.json({ success: true, credits: currentCredits })
  }

  const targetCredits = 2
  const client = adminClient ?? supabase
  const { data: updatedProfile, error: updateError } = await client
    .from("profiles")
    .update({ credits: targetCredits })
    .eq("id", userId)
    .select("credits")
    .maybeSingle()

  if (updateError) {
    console.error("[billing] failed to grant free credits", updateError)
    return NextResponse.json({ success: false, error: "FAILED_TO_GRANT_CREDITS" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    credits: updatedProfile?.credits ?? targetCredits,
  })
}
