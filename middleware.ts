import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: session, error } = await supabase.auth.getSession()

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔹 [middleware] path:', req.nextUrl.pathname)
      console.log('🔹 [middleware] has session:', !!session.session)
      if (error) console.error('🔸 [middleware] session error:', error)
    }
  } catch (error) {
    console.error('❌ [middleware] failed to refresh Supabase session', error)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
