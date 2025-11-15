import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { ErrorBoundary } from "@/components/error-boundary"
import { getSupabaseServerClient } from "@/lib/supabaseClient"

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = cookies()
  let accessToken =
    cookieStore.get("sb-access-token")?.value ??
    cookieStore.get("supabase-auth-token")?.value ??
    null

  if (!accessToken) {
    redirect("/login")
  }

  const supabase = getSupabaseServerClient(undefined, accessToken)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    redirect("/login")
  }

  if (!children) {
    notFound()
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}
