import { v2 as cloudinary } from "cloudinary"

import { apiResponse } from "@/lib/api-response"

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const SIGNED_UPLOAD_PRESET =
  process.env.CLOUDINARY_SIGNED_UPLOAD_PRESET ?? "modelcast_signed_upload"

const DEFAULT_UPLOAD_FOLDER = "modelcast/uploads"

const normalizeFolder = (rawFolder: unknown): string => {
  if (typeof rawFolder !== "string") {
    return DEFAULT_UPLOAD_FOLDER
  }
  const cleaned = rawFolder
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/")
  return cleaned || DEFAULT_UPLOAD_FOLDER
}

const parseCloudinaryError = async (response: Response, fallback: string) => {
  const errorText = await response.text()
  try {
    const parsed = JSON.parse(errorText)
    if (typeof parsed?.error === "string") {
      return parsed.error
    }
    if (typeof parsed?.error?.message === "string") {
      return parsed.error.message
    }
    if (typeof parsed?.message === "string") {
      return parsed.message
    }
  } catch {
    // ignore JSON parse errors
  }
  return errorText || fallback
}

export async function POST(request: Request) {
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[api/upload] Missing Cloudinary environment variables.")
    return apiResponse({ error: "Cloudinary is not configured." }, { status: 500 })
  }

  try {
    const incomingFormData = await request.formData()
    const file = incomingFormData.get("file")
    const folder = normalizeFolder(incomingFormData.get("folder"))

    if (!(file instanceof File) || file.size === 0) {
      return apiResponse({ error: "Invalid or missing file upload." }, { status: 400 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign = {
      timestamp,
      folder,
      upload_preset: SIGNED_UPLOAD_PRESET,
      return_delete_token: "1",
    }
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)

    const uploadForm = new FormData()
    uploadForm.append("file", file)
    uploadForm.append("api_key", apiKey)
    uploadForm.append("timestamp", String(timestamp))
    uploadForm.append("signature", signature)
    uploadForm.append("folder", folder)
    uploadForm.append("upload_preset", SIGNED_UPLOAD_PRESET)
    uploadForm.append("return_delete_token", "1")

    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
    const cloudinaryResponse = await fetch(uploadEndpoint, {
      method: "POST",
      body: uploadForm,
    })

    if (!cloudinaryResponse.ok) {
      const errorMessage = await parseCloudinaryError(
        cloudinaryResponse,
        "Cloudinary upload failed.",
      )
      console.error("[api/upload] Cloudinary upload failed:", errorMessage)
      return apiResponse({ error: errorMessage }, { status: 502 })
    }

    const data = await cloudinaryResponse.json()
    const secureUrl = data?.secure_url
    const publicId = data?.public_id

    if (typeof secureUrl !== "string" || typeof publicId !== "string") {
      console.error("[api/upload] Missing secure_url or public_id in Cloudinary response.")
      return apiResponse({ error: "Upload succeeded but response was incomplete." }, { status: 502 })
    }

    return apiResponse({
      secureUrl,
      publicId,
      deleteToken: typeof data?.delete_token === "string" ? data.delete_token : undefined,
    })
  } catch (error) {
    console.error("[api/upload] Failed to process upload", error)
    return apiResponse({ error: "Unable to upload image." }, { status: 500 })
  }
}
