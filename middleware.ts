import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, '') ?? ''

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (!session) {
      const origin = SITE_URL.length > 0 ? SITE_URL : req.nextUrl.origin
      const redirectUrl = new URL('/auth/signin', origin)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }

    if (process.env.NODE_ENV !== 'production' && error) {
      console.error('🔸 [middleware] session error:', error)
    }
  } catch (err) {
    console.error('❌ [middleware] failed to validate Supabase session', err)
    const origin = SITE_URL.length > 0 ? SITE_URL : req.nextUrl.origin
    const fallbackUrl = new URL('/auth/signin', origin)
    fallbackUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(fallbackUrl)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
