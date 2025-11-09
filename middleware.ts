import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabaseClient'

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, '') ?? ''

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const accessToken =
      req.cookies.get('sb-access-token')?.value ??
      req.cookies.get('supabase-auth-token')?.value ??
      null

    if (!accessToken) {
      const origin = SITE_URL.length > 0 ? SITE_URL : req.nextUrl.origin
      const redirectUrl = new URL('/login', origin)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }

    const supabase = getSupabaseServerClient(req, accessToken)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (!user) {
      const origin = SITE_URL.length > 0 ? SITE_URL : req.nextUrl.origin
      const redirectUrl = new URL('/login', origin)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }

    if (process.env.NODE_ENV !== 'production' && error) {
      console.error('🔸 [middleware] session error:', error)
    }
  } catch (err) {
    console.error('❌ [middleware] failed to validate Supabase session', err)
    const origin = SITE_URL.length > 0 ? SITE_URL : req.nextUrl.origin
    const fallbackUrl = new URL('/login', origin)
    fallbackUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(fallbackUrl)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
