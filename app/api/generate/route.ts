import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

import { createPrediction, waitForPrediction } from "@/lib/replicate"
import { buildWatermarkedPreviewUrl } from "@/lib/cloudinary"

const replicateModelVersion = process.env.REPLICATE_MODEL_VERSION
const replicateEnabled = process.env.REPLICATE_ENABLED === "true"

function buildModelVariant(gender: string, ageGroup: string) {
  const normalizedGender = typeof gender === "string" ? gender.toLowerCase() : "female"
  const normalizedAge = typeof ageGroup === "string" ? ageGroup.toLowerCase() : "youth"
  return `${normalizedGender}_${normalizedAge}`
}

export async function POST(request: Request) {
  if (replicateEnabled) {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!replicateModelVersion) {
      return NextResponse.json(
        { error: "Replication model version is not configured." },
        { status: 500 },
      )
    }
  }

  const payload = await request.json()

  const { image, styleType, gender, ageGroup, skinTone, aspectRatio, isFreePreview } = payload ?? {}

  const isFreeUser = Boolean(isFreePreview)
  const numOutputs = isFreeUser ? 1 : 2

  if (
    typeof image !== "string" ||
    typeof styleType !== "string" ||
    typeof gender !== "string" ||
    typeof ageGroup !== "string" ||
    typeof skinTone !== "string" ||
    typeof aspectRatio !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 })
  }

  if (!image.startsWith("https://")) {
    return NextResponse.json({ error: "Image URL must be secure." }, { status: 400 })
  }

  try {
    const prediction = await createPrediction({
      version: replicateModelVersion ?? "mock-model-version",
      image,
      style: styleType,
      skinTone,
      aspectRatio,
      model: buildModelVariant(gender, ageGroup),
      numOutputs,
    })

    const result = await waitForPrediction(prediction.id, { expectedOutputs: numOutputs })

    if (result.status !== "succeeded") {
      console.error("Replicate prediction failed", result)
      return NextResponse.json(
        {
          error: "Prediction did not succeed.",
          status: result.status,
          details: result.error ?? null,
        },
        { status: 500 },
      )
    }

    const rawOutputs = Array.isArray(result.output)
      ? result.output
      : typeof result.output === "string"
        ? [result.output]
        : []

    if (!Array.isArray(rawOutputs) || rawOutputs.length === 0) {
      return NextResponse.json(
        { error: "Unexpected prediction output format." },
        { status: 500 },
      )
    }

    const outputUrls = rawOutputs
      .slice(0, numOutputs)
      .map((output) => {
        if (typeof output !== "string") {
          throw new Error("Prediction output must be a URL string")
        }
        return isFreeUser ? buildWatermarkedPreviewUrl(output) : output
      })

    return NextResponse.json({
      outputUrls,
      outputUrl: outputUrls[0],
      predictionId: result.id,
      mode: isFreeUser ? "preview" : "hd",
    })
  } catch (error) {
    console.error("Failed to generate prediction", error)
    return NextResponse.json({ error: "Generation failed." }, { status: 500 })
  }
}
