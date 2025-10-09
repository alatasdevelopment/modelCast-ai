"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { ModelGenerator, type GenerationSettings } from "@/components/dashboard/model-generator"
import { ResultsGallery } from "@/components/dashboard/results-gallery"
import type { GeneratedImage } from "@/components/dashboard/types"
import { SessionGuard } from "@/components/auth/session-guard"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"

function DashboardContent() {
  const router = useRouter()
  const { user, signOut } = useSupabaseAuth()
  const { toast } = useToast()

  const [credits, setCredits] = useState(12)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const fullName = useMemo(() => {
    const maybeName = user?.user_metadata?.full_name
    return typeof maybeName === "string" && maybeName.trim().length > 0 ? maybeName : null
  }, [user?.user_metadata?.full_name])

  const handleGenerate = useCallback(
    async (settings: GenerationSettings) => {
      setIsGenerating(true)
      try {
        toast({
          title: "Generating model shot",
          description: "This preview uses placeholder data until the Replicate integration lands.",
        })

        await new Promise((resolve) => setTimeout(resolve, 1800))

        const newImage: GeneratedImage = {
          id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(),
          url: "https://images.unsplash.com/photo-1531256456869-ce942a665e80?q=80&w=500&auto=format&fit=crop",
          timestamp: new Date(),
          settings: {
            styleType: settings.styleType,
            gender: settings.gender,
            ageGroup: settings.ageGroup,
            skinTone: settings.skinTone,
            aspectRatio: settings.aspectRatio,
          },
        }

        setGeneratedImages((previous) => [newImage, ...previous])
        setCredits((previous) => Math.max(previous - 1, 0))
      } catch (error) {
        console.error("[dashboard] generate preview failed", error)
        toast({
          title: "Something went wrong",
          description: "Try again in a few seconds.",
          variant: "destructive",
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [toast],
  )

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      toast({
        title: "Signed out",
        description: "Come back soon for new shoots.",
      })
      router.replace("/")
      router.refresh()
    } catch (error) {
      console.error("[dashboard] sign out failed", error)
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }, [router, signOut, toast])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#0B0B0B] text-white">
      <DashboardNav
        credits={credits}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:gap-12 lg:px-8 xl:gap-16">
        <section className="w-full flex-1 space-y-8">
          <ModelGenerator onGenerate={handleGenerate} isGenerating={isGenerating} hasCredits={credits > 0} />
        </section>

        <aside className="w-full flex-1 space-y-8">
          <ResultsGallery images={generatedImages} />
          <ProfileCard credits={credits} userName={fullName} email={user?.email ?? null} />
        </aside>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <SessionGuard
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <span className="text-sm text-muted-foreground">Checking your session…</span>
        </div>
      }
    >
      <DashboardContent />
    </SessionGuard>
  )
}
