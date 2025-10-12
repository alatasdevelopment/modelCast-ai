import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

const isProduction = process.env.NODE_ENV === "production"

const FASHN_ENDPOINT = "https://api.fashn.ai/v1/tryon"
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/"
const DEFAULT_BACKGROUND = "studio"
const DEFAULT_RESOLUTION = "1024x1024"

interface GenerateRequestBody {
  imageUrl?: string
  image?: string
  clothingImageUrl?: string
  style?: string
  styleType?: string
  gender?: string
  age?: string
  ageGroup?: string
  tone?: string
  skinTone?: string
}

type ParsedPayload = {
  imageUrl: string
  clothingImageUrl?: string
  style: string
  gender: string
  age: string
  skinTone: string
}

type FashnResponse =
  | {
      success: true
      output_url: string
    }
  | {
      success: false
      error?: string
      message?: string
    }

const logInfo = (...args: unknown[]) => {
  if (!isProduction) {
    console.info(...args)
  }
}

const parseRequestPayload = async (request: Request): Promise<ParsedPayload> => {
  let payload: GenerateRequestBody

  try {
    payload = (await request.json()) as GenerateRequestBody
  } catch {
    throw new Error("INVALID_PAYLOAD")
  }

  const imageUrl = payload.imageUrl ?? payload.image
  const style = payload.style ?? payload.styleType
  const gender = payload.gender
  const age = payload.age ?? payload.ageGroup
  const tone = payload.tone ?? payload.skinTone
  const clothingImageUrl =
    typeof payload.clothingImageUrl === "string" && payload.clothingImageUrl.length > 0
      ? payload.clothingImageUrl
      : undefined

  if (
    typeof imageUrl !== "string" ||
    typeof style !== "string" ||
    typeof gender !== "string" ||
    typeof age !== "string" ||
    typeof tone !== "string"
  ) {
    throw new Error("INVALID_PAYLOAD")
  }

  if (!imageUrl.startsWith(CLOUDINARY_PREFIX)) {
    throw new Error("INVALID_IMAGE_URL")
  }

  return {
    imageUrl,
    clothingImageUrl,
    style,
    gender,
    age,
    skinTone: tone,
  }
}

interface FashnGenerationOptions {
  imageUrl: string
  clothingImageUrl?: string
  style: string
  gender: string
  skinTone: string
}

const callFashn = async ({
  imageUrl,
  clothingImageUrl,
  style,
  gender,
  skinTone,
}: FashnGenerationOptions): Promise<string> => {
  if (!FASHN_API_KEY) {
    throw new Error("FASHN API key is not configured.")
  }

  const requestBody: Record<string, unknown> = {
    model_image_url: imageUrl,
    style,
    gender,
    skin_tone: skinTone,
    background: DEFAULT_BACKGROUND,
    resolution: DEFAULT_RESOLUTION,
  }

  if (clothingImageUrl) {
    requestBody.clothing_image_url = clothingImageUrl
  }

  const response = await fetch(FASHN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FASHN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  const rawBody = await response.text()
  let parsedBody: FashnResponse | null = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as FashnResponse
    } catch {
      parsedBody = null
    }
  }

  if (!response.ok || !parsedBody) {
    const errorMessage =
      (parsedBody && "error" in parsedBody && typeof parsedBody.error === "string" && parsedBody.error) ||
      (parsedBody && "message" in parsedBody && typeof parsedBody.message === "string" && parsedBody.message) ||
      `FASHN request failed (${response.status})`

    throw new Error(errorMessage)
  }

  if (!parsedBody.success || typeof parsedBody.output_url !== "string") {
    throw new Error("Invalid response from FASHN AI.")
  }

  return parsedBody.output_url
}

export async function POST(request: Request) {
  try {
    let parsedPayload: ParsedPayload

    try {
      parsedPayload = await parseRequestPayload(request)
    } catch (error) {
      if ((error as Error).message === "INVALID_IMAGE_URL" || (error as Error).message === "INVALID_PAYLOAD") {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 })
      }
      console.error("[generate] payload parsing failed", error)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const isFashnEnabled = process.env.FASHN_ENABLED === "true"

    if (!isFashnEnabled) {
      if (!isProduction) {
        console.log("[generate] Mock mode active — skipping credits and FASHN API.")
        console.log("[generate] Mock mode active — returning static placeholder image")
      }

      return NextResponse.json({
        success: true,
        outputUrl: "https://placehold.co/600x800/111111/9FFF57?text=Mock+ModelCast+Shot",
        creditsRemaining: 99,
      })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn("[generate] Unauthorized request", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("[generate] failed to fetch credits", profileError)
      return NextResponse.json({ success: false, error: "Unable to verify credits" }, { status: 500 })
    }

    const credits = typeof profile?.credits === "number" ? profile.credits : 0

    if (credits <= 0) {
      return NextResponse.json({ error: "Out of credits" }, { status: 402 })
    }

    let outputUrl: string

    try {
      outputUrl = await callFashn({
        imageUrl: parsedPayload.imageUrl,
        clothingImageUrl: parsedPayload.clothingImageUrl,
        style: parsedPayload.style,
        gender: parsedPayload.gender,
        skinTone: parsedPayload.skinTone,
      })
    } catch (error) {
      console.error("[generate] FASHN request failed", error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Generation failed",
        },
        { status: 500 },
      )
    }

    const creditsRemaining = credits - 1
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: creditsRemaining })
      .eq("id", user.id)

    if (updateError) {
      console.error("[generate] failed to decrement credits", updateError)
      return NextResponse.json({ success: false, error: "Unable to update credits" }, { status: 500 })
    }

    logInfo("[generate] FASHN completed", { userId: user.id, outputUrl })

    return NextResponse.json({
      success: true,
      outputUrl,
      creditsRemaining,
    })
  } catch (error) {
    console.error("[generate] server error", error)
    return NextResponse.json({ success: false, error: "Generation failed" }, { status: 500 })
  }
}
