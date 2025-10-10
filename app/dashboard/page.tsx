"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { ModelGenerator, type GenerationSettings } from "@/components/dashboard/model-generator"
import { ResultsGallery } from "@/components/dashboard/results-gallery"
import { LatestPreviewCard } from "@/components/dashboard/latest-preview-card"
import type { GeneratedImage } from "@/components/dashboard/types"
import { SessionGuard } from "@/components/auth/session-guard"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function DashboardContent() {
  const router = useRouter()
  const { user, signOut } = useSupabaseAuth()
  const { toast } = useToast()

  const FREE_TIER_MAX = 2
  const MAX_CREDITS = 10
  const [credits, setCredits] = useState(FREE_TIER_MAX)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const fullName = useMemo(() => {
    const maybeName = user?.user_metadata?.full_name
    return typeof maybeName === "string" && maybeName.trim().length > 0 ? maybeName : null
  }, [user?.user_metadata?.full_name])

  const handleUpgradeClick = useCallback(() => setShowUpgradeModal(true), [])

  const handleGenerate = useCallback(
    async (settings: GenerationSettings): Promise<string | null> => {
      const isFreeMode = credits <= FREE_TIER_MAX

      if (credits <= 0) {
        toast({
          title: "Out of credits",
          description: "You’ve used all your free previews. Upgrade to HD to continue.",
          variant: "destructive",
        })
        return null
      }

      if (!settings.imageUrl) {
        toast({
          title: "Product image missing",
          description: "Upload your product image before generating.",
          variant: "destructive",
        })
        return null
      }

      const startedAt = Date.now()
      let latestOutputUrl: string | null = null
      setIsGenerating(true)
      toast({
        title: "Generating your model shot…",
        description: "Hang tight while we style your product.",
        duration: 3000,
      })

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
            isFreePreview: isFreeMode,
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

        const payloadOutputUrls =
          payload && Array.isArray(payload.outputUrls)
            ? (payload.outputUrls as unknown[]).filter((value): value is string => typeof value === "string")
            : []

        if (payloadOutputUrls.length === 0) {
          throw new Error("No output returned from the generation service.")
        }

        const outputUrl = payloadOutputUrls[0]
        latestOutputUrl = outputUrl

        const mode = payload && typeof payload.mode === "string"
          ? (payload.mode === "preview" ? "preview" : "hd")
          : isFreeMode
            ? "preview"
            : "hd"
        const limitedOutputUrls = mode === "preview" ? [outputUrl] : payloadOutputUrls

        const newImage: GeneratedImage = {
          id:
            (payload && typeof payload.predictionId === "string" && payload.predictionId) ||
            (typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : Date.now().toString()),
          url: outputUrl,
          urls: limitedOutputUrls,
          mode,
          timestamp: new Date(),
          settings: {
            styleType: settings.styleType,
            gender: settings.gender,
            ageGroup: settings.ageGroup,
            skinTone: settings.skinTone,
            aspectRatio: settings.aspectRatio,
          },
        }

        setGeneratedImages((previous) => [newImage, ...previous].slice(0, 2))
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

      return latestOutputUrl
    },
    [FREE_TIER_MAX, credits, router, toast],
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
      return true
    } catch (error) {
      console.error("[dashboard] sign out failed", error)
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSigningOut(false)
    }
  }, [router, signOut, toast])

  const currentModeLabel = credits <= FREE_TIER_MAX ? "Preview Mode (1 image, watermarked)" : "HD Mode (2 images)"
  const displayMaxCredits = credits <= FREE_TIER_MAX ? FREE_TIER_MAX : MAX_CREDITS
  const latestImage = generatedImages[0] ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#080808] to-[#0b0b0b] text-white">
      <DashboardNav
        credits={credits}
        maxCredits={displayMaxCredits}
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <main className="mx-auto mt-10 mb-12 flex w-full max-w-screen-xl flex-col gap-8 px-6 pb-6 md:flex-row md:items-start lg:gap-12 lg:px-10">
        <section className="order-1 w-full space-y-6 md:order-1 md:flex-[0.6] lg:flex-[0.58]">
          <ModelGenerator
            onGenerate={handleGenerate}
            hasCredits={credits > 0}
            modeLabel={currentModeLabel}
            onUpgradeClick={handleUpgradeClick}
          />
        </section>

        <aside className="order-2 w-full space-y-6 border-t border-white/5 pt-6 md:order-2 md:border-t-0 md:border-l md:border-white/10 md:pl-8 md:pt-0 md:flex-[0.4] lg:pl-12">
          <LatestPreviewCard image={latestImage} isGenerating={isGenerating} />
          <ResultsGallery images={generatedImages} isGenerating={isGenerating} />
        </aside>
      </main>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-lg overflow-hidden border-white/10 bg-[#101010]/95 px-6 py-6 text-white shadow-[0_0_32px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:px-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[0.14em] text-[var(--brand-green)]">
              Your Account
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-300">
              Manage your profile, plan, and account actions.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <ProfileCard
              credits={credits}
              maxCredits={displayMaxCredits}
              onUpgradeClick={handleUpgradeClick}
              onClose={() => setIsProfileOpen(false)}
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
              userId={user?.id ?? null}
              userName={fullName}
              email={user?.email ?? null}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md border-white/10 bg-[#101010]/95 px-6 py-6 text-white shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[0.14em] text-[var(--brand-green)]">
              Upgrade to HD Quality
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-300">
              Unlock HD renders and keep generating runway-ready photos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-neutral-200">
            <p>Each new model shot costs just $1. Pay only when you need another render.</p>
            <p className="text-sm text-neutral-400">
              Payments are coming soon. Tap notify and we&rsquo;ll email you the moment purchases open.
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full border-white/20 bg-white/10 text-neutral-200 transition hover:border-white/30 hover:bg-white/[0.18] hover:text-white sm:w-auto"
              onClick={() => setShowUpgradeModal(false)}
            >
              Not now
            </Button>
            <Button
              type="button"
              className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-hover)] text-black shadow-[0_0_22px_rgba(159,255,87,0.25)] transition hover:translate-y-[-1px] hover:shadow-[0_0_26px_rgba(159,255,87,0.35)] focus-visible:shadow-[0_0_28px_rgba(159,255,87,0.4)] sm:w-auto"
              onClick={() => setShowUpgradeModal(false)}
            >
              Notify me
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
