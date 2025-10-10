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
    async (settings: GenerationSettings): Promise<string | null> => {
      if (!settings.imageUrl) {
        toast({
          title: "Product image missing",
          description: "Upload your product image before generating.",
          variant: "destructive",
        })
        return null
      }

      const startedAt = Date.now()
      setIsGenerating(true)
      toast({
        title: "Generating your model shot…",
        description: "Hang tight while we style your product.",
        duration: 3000,
      })

      let outputUrl: string | null = null

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: settings.imageUrl,
            styleType: settings.styleType,
            gender: settings.gender,
            ageGroup: settings.ageGroup,
            skinTone: settings.skinTone,
            aspectRatio: settings.aspectRatio,
          }),
        })

        const payload = await response.json().catch(() => null)

        if (response.status === 401) {
          toast({
            title: "Session expired",
            description: "Sign in again to keep generating model shots.",
            variant: "destructive",
          })
          router.replace("/login")
          router.refresh()
          return null
        }

        if (!response.ok) {
          const message =
            (payload && typeof payload.error === "string" && payload.error) ||
            "Generation failed. Please try again."
          throw new Error(message)
        }

        outputUrl =
          (payload && typeof payload.outputUrl === "string" && payload.outputUrl) ||
          (payload && Array.isArray(payload.output) && typeof payload.output[payload.output.length - 1] === "string"
            ? payload.output[payload.output.length - 1]
            : null)

        if (!outputUrl) {
          throw new Error("No output returned from the generation service.")
        }

        const newImage: GeneratedImage = {
          id:
            (payload && typeof payload.predictionId === "string" && payload.predictionId) ||
            (typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : Date.now().toString()),
          url: outputUrl,
          timestamp: new Date(),
          settings: {
            styleType: settings.styleType,
            gender: settings.gender,
            ageGroup: settings.ageGroup,
            skinTone: settings.skinTone,
            aspectRatio: settings.aspectRatio,
          },
        }

        setGeneratedImages((previous) => [newImage, ...previous].slice(0, 3))
        setCredits((previous) => Math.max(previous - 1, 0))
        toast({
          title: "Model shot generated successfully.",
          description: "Check Recent Generations for your new look.",
        })
      } catch (error) {
        console.error("[dashboard] generate prediction failed", error)
        toast({
          title: "Generation failed. Please try again.",
          description:
            error instanceof Error ? error.message : "Unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        const replicateEnabled =
          typeof process.env.NEXT_PUBLIC_REPLICATE_ENABLED === "string"
            ? process.env.NEXT_PUBLIC_REPLICATE_ENABLED === "true"
            : false
        const minDuration = replicateEnabled ? 0 : 900
        const elapsed = Date.now() - startedAt
        if (elapsed < minDuration) {
          await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed))
        }
        setIsGenerating(false)
      }

      return outputUrl
    },
    [router, toast],
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
          <ModelGenerator
            onGenerate={handleGenerate}
            hasCredits={credits > 0}
            lastGeneratedUrl={generatedImages[0]?.url ?? null}
          />
        </section>

        <aside className="w-full flex-1 space-y-8">
          <ResultsGallery images={generatedImages} isGenerating={isGenerating} />
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
