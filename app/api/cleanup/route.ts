import { v2 as cloudinary } from 'cloudinary'

import { apiResponse } from '@/lib/api-response'

const CRON_SECRET = process.env.CRON_SECRET

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: Request) {
  try {
    if (!CRON_SECRET) {
      console.error('[cleanup] CRON_SECRET not configured')
      return apiResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')

    if (token !== CRON_SECRET) {
      return apiResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()
    const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000).toISOString()

    const { resources = [] } = await cloudinary.search
      .expression(`tags=ephemeral AND uploaded_at<${thirtyMinutesAgo}`)
      .max_results(50)
      .execute()

    let deleted = 0

    for (const resource of resources) {
      const publicId = resource.public_id as string | undefined
      if (!publicId) continue

      const result = await cloudinary.uploader.destroy(publicId)
      if (result.result === 'ok' || result.result === 'not_found') {
        deleted += 1
      }
    }

    return apiResponse({ checked: resources.length, deleted })
  } catch (error) {
    console.error('[ERROR] cleanup job failed:', error)
    return apiResponse({ error: 'Unexpected server error.' }, { status: 500 })
  }
}

export function POST() {
  return apiResponse({ error: 'Method Not Allowed' }, { status: 405 })
}

export function PUT() {
  return apiResponse({ error: 'Method Not Allowed' }, { status: 405 })
}

export function DELETE() {
  return apiResponse({ error: 'Method Not Allowed' }, { status: 405 })
}
