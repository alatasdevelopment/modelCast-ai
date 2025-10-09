"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSupabaseAuth } from "./supabase-auth-provider"

type SessionGuardProps = {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function SessionGuard({ children, redirectTo = "/login", fallback = null }: SessionGuardProps) {
  const { session, isLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session && redirectTo) {
      router.replace(redirectTo)
    }
  }, [isLoading, session, redirectTo, router])

  if (isLoading) {
    return fallback
  }

  if (!session) {
    return fallback
  }

  return <>{children}</>
}
