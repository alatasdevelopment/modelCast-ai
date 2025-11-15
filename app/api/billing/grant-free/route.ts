import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseClient"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof getSupabaseAdminClient> | null = null
if (SUPABASE_SERVICE_ROLE_KEY) {
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.warn("[billing] unable to initialize admin client", error)
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[billing] missing Supabase configuration")
    return NextResponse.json({ success: false, error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
  }

  const cookieStore = await cookies()
  let accessToken =
    cookieStore.get("sb-access-token")?.value ??
    cookieStore.get("supabase-auth-token")?.value ??
    null

  if (!accessToken) {
    const authHeader = request.headers.get("Authorization")
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.slice("Bearer ".length)
    }
  }

  if (!accessToken) {
    console.warn("[billing] grant-free missing access token")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseServerClient(request, accessToken)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken)

  if (userError || !user) {
    console.warn("[billing] grant-free requires authentication", userError)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const userId = user.id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits, is_pro, plan")
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
    return NextResponse.json({ success: false, error: "Pro members already have unlimited access to HD generations." }, { status: 400 })
  }

  const currentCredits = typeof profile.credits === "number" ? profile.credits : 0
  if (currentCredits >= 2) {
    return NextResponse.json({ success: true, credits: currentCredits })
  }

  const targetCredits = 2
  const client = adminClient ?? supabase
  const { data: updatedProfile, error: updateError } = await client
    .from("profiles")
    .update({ credits: targetCredits, is_pro: false, is_studio: false, plan: "free" })
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
