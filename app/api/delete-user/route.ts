import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ERROR] Delete user route misconfigured: missing Supabase environment variables.')
    return NextResponse.json({ success: false, error: 'SERVER_CONFIGURATION_ERROR' }, { status: 500 })
  }

  try {
    const { userId } = await req.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'INVALID_USER_ID' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error('[ERROR] Failed to delete user:', error)
      return NextResponse.json({ success: false, error: error.message ?? 'DELETE_FAILED' }, { status: 500 })
    }

    console.log(`[SUCCESS] Account deleted for user: ${userId}`)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[ERROR] Unexpected delete-user failure:', error)
    return NextResponse.json({ success: false, error: 'UNEXPECTED_ERROR' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 })
}
