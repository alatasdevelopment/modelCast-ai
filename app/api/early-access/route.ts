import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseClient"

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string | null }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Invalid email" },
        { status: 400 },
      )
    }

    const supabase = getSupabaseServerClient(req)
    const { error } = await supabase.from("early_access").insert({ email })

    if (error) {
      const isDuplicate = error.code === "23505"
      if (isDuplicate) {
        return NextResponse.json({ success: true })
      }

      console.error("[EARLY_ACCESS_ERROR]", error.message)
      return NextResponse.json(
        { success: false, message: "Failed to save your email." },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[EARLY_ACCESS_FATAL]", error)
    return NextResponse.json(
      { success: false, message: "Unexpected server error." },
      { status: 500 },
    )
  }
}
