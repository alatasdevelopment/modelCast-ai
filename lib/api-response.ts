import { NextResponse } from "next/server"

const DEFAULT_API_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
} as const

export function apiResponse<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers ?? {})
  Object.entries(DEFAULT_API_HEADERS).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  })

  return NextResponse.json(body, {
    ...init,
    headers,
  })
}
