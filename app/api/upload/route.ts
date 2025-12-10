import { v2 as cloudinary } from 'cloudinary'

import { apiResponse } from '@/lib/api-response'

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

const DEFAULT_UPLOAD_FOLDER = 'modelcast/uploads'

type UploadSignaturePayload = {
  folder?: unknown
}

const normalizeFolder = (rawFolder: unknown): string => {
  if (typeof rawFolder !== 'string') {
    return DEFAULT_UPLOAD_FOLDER
  }
  const cleaned = rawFolder
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/')
  return cleaned || DEFAULT_UPLOAD_FOLDER
}

export async function POST(request: Request) {
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[api/upload] Missing Cloudinary environment variables.')
    return apiResponse({ error: 'Cloudinary is not configured.' }, { status: 500 })
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as UploadSignaturePayload
    const folder = normalizeFolder(payload.folder)
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret)

    return apiResponse({
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
    })
  } catch (error) {
    console.error('[api/upload] Failed to generate signature', error)
    return apiResponse({ error: 'Unable to generate upload signature.' }, { status: 500 })
  }
}
