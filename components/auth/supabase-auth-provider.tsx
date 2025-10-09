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
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const resolveSession = async () => {
      setIsLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("[auth] error reading session", error)
      }

      if (isMounted) {
        setSession(session ?? null)
        setIsLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    resolveSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut: async () => {
      const { error } = await getSupabaseClient().auth.signOut()
      if (error) {
        console.error("[auth] signOut failed", error)
        throw error
      }
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
