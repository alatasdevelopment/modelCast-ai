import { getSupabaseServerClient } from "@/lib/supabaseClient"
import { apiResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string | null }

    if (typeof email !== "string" || !email.includes("@") || email.length > 120) {
      return apiResponse(
        { success: false, message: "Invalid email" },
        { status: 400 },
      )
    }

    const supabase = getSupabaseServerClient(req)
    const { error } = await supabase.from("early_access").insert({ email })

    if (error) {
      const isDuplicate = error.code === "23505"
      if (isDuplicate) {
        return apiResponse({ success: true })
      }

      console.error("[ERROR] Early access insert failed:", error.message)
      return apiResponse(
        { success: false, message: "Failed to save your email." },
        { status: 500 },
      )
    }

    return apiResponse({ success: true })
  } catch (error) {
    console.error("[ERROR] Early access API failure:", error)
    return apiResponse(
      { success: false, message: "Unexpected server error." },
      { status: 500 },
    )
  }
}
