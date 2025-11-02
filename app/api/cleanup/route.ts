import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

const CRON_SECRET = process.env.CRON_SECRET

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: Request) {
  if (!CRON_SECRET) {
    console.error('[cleanup] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000).toISOString()

  try {
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

    return NextResponse.json({ checked: resources.length, deleted })
  } catch (error) {
    console.error('[cleanup] failed', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

export function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

export function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
