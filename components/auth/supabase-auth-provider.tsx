"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"

import { getSupabaseClient } from "@/lib/supabaseClient"

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabaseClient = useMemo(() => getSupabaseClient(), [])

  const syncSessionCookies = (nextSession: Session | null) => {
    if (typeof document === "undefined") return

    const secure = window.location.protocol === "https:" ? " Secure" : ""

    const setCookie = (name: string, value: string, maxAge: number) => {
      document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax;${secure}`
    }

    const clearCookie = (name: string) => {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax;${secure}`
    }

    if (nextSession?.access_token) {
      const accessMaxAge = nextSession.expires_in ?? 3600
      setCookie("sb-access-token", nextSession.access_token, accessMaxAge)
      setCookie("supabase-auth-token", nextSession.access_token, accessMaxAge)

      if (nextSession.refresh_token) {
        setCookie("sb-refresh-token", nextSession.refresh_token, 60 * 60 * 24 * 60)
      }
    } else {
      clearCookie("sb-access-token")
      clearCookie("supabase-auth-token")
      clearCookie("sb-refresh-token")
    }
  }

  useEffect(() => {
    let isMounted = true

    const resolveSession = async () => {
      setIsLoading(true)
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession()

      if (error) {
        console.error("[auth] error reading session", error)
      }

      if (isMounted) {
        setSession(session ?? null)
        setIsLoading(false)
        syncSessionCookies(session ?? null)
      }
    }

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      syncSessionCookies(nextSession ?? null)
    })

    resolveSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabaseClient])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut: async () => {
      const { error } = await supabaseClient.auth.signOut()
      if (error) {
        console.error("[auth] signOut failed", error)
        throw error
      }
      syncSessionCookies(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useSupabaseAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider")
  }
  return ctx
}
