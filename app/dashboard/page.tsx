"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { ModelGenerator, type GenerationSettings } from "@/components/dashboard/model-generator"
import { RecentGenerations } from "@/components/dashboard/recent-generations"
import { LatestPreviewCard } from "@/components/dashboard/latest-preview-card"
import type { GeneratedImage, PlanTier } from "@/components/dashboard/types"
import { SessionGuard } from "@/components/auth/session-guard"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient, fetchGenerationsSafe, type GenerationRow } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const DEV_MODE_CLIENT = process.env.NEXT_PUBLIC_DEV_MODE === "true"
const DEV_MODE_CREDITS = 999

const resolvePlanTier = (
  rawPlan?: string | null,
  isProFlag?: boolean | null,
  isStudioFlag?: boolean | null,
): PlanTier => {
  const normalized = typeof rawPlan === "string" ? rawPlan.toLowerCase() : null
  if (isStudioFlag || normalized === "studio") return "studio"
  if (isProFlag || normalized === "pro") return "pro"
  return "free"
}

function DashboardContent() {
  const router = useRouter()
  const { user, signOut } = useSupabaseAuth()
  const { toast } = useToast()

  const [plan, setPlan] = useState<PlanTier>(DEV_MODE_CLIENT ? "pro" : "free")
  const [credits, setCredits] = useState<number>(DEV_MODE_CLIENT ? DEV_MODE_CREDITS : 2)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const supabaseClient = useMemo(() => getSupabaseClient(), [])

  const mapGenerationRow = useCallback(
    (row: GenerationRow): GeneratedImage => {
      const planTier = (row.plan ?? "free") as PlanTier
      const formMetadata = (row.metadata?.form ?? {}) as Record<string, string | undefined>
      const deliveryHint = (row.metadata?.delivery ?? null) as string | null
      const derivedMode: GeneratedImage["mode"] =
        deliveryHint === "hd" || planTier !== "free" ? "hd" : "preview"

      const settings = {
        styleType: formMetadata.styleType ?? "studio",
        gender: formMetadata.gender ?? "female",
        ageGroup: formMetadata.ageGroup ?? "adult",
        skinTone: formMetadata.skinTone ?? "medium",
        aspectRatio: formMetadata.aspectRatio ?? "3:4",
      }

      const hasSettings = Object.keys(formMetadata).length > 0

      return {
        id: row.id,
        url: row.image_url,
        urls: [row.image_url],
        mode: derivedMode,
        plan: planTier,
        timestamp: row.created_at ? new Date(row.created_at) : new Date(),
        settings: hasSettings ? settings : undefined,
      }
    },
    [],
  )

  const fetchGenerations = useCallback(
    async (explicitUserId?: string | null) => {
      let targetUserId = explicitUserId ?? null

      if (!targetUserId) {
        const {
          data: { user: sessionUser },
          error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError) {
          console.error("[dashboard] failed to resolve session before loading generations", userError)
          return
        }

        if (!sessionUser?.id) {
          return
        }

        targetUserId = sessionUser.id
      }

      if (!targetUserId) {
        return
      }

      const { data: finalRows, error } = await fetchGenerationsSafe({
        supabase: supabaseClient,
        userId: targetUserId,
      })

      if (error) {
        console.error("[dashboard] failed to load generations", error)
        return
      }

      if (finalRows) {
        setGeneratedImages(finalRows.map(mapGenerationRow))
      }
    },
    [mapGenerationRow, supabaseClient],
  )

  const fullName = useMemo(() => {
    const maybeName = user?.user_metadata?.full_name
    return typeof maybeName === "string" && maybeName.trim().length > 0 ? maybeName : null
  }, [user?.user_metadata?.full_name])

  const handleUpgradeClick = useCallback(() => {
    toast({
      title: "Explore Pro plans",
      description: "Opening the pricing page so you can compare tiers.",
      duration: 4000,
    })
    router.push("/pricing")
  }, [router, toast])

  const handleDownload = useCallback(
    async (url: string, isWatermarked: boolean) => {
      try {
        const response = await fetch(url, { mode: "cors" })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const suffix = isWatermarked ? "_preview" : ""
        link.href = blobUrl
        link.download = `modelcast_output${suffix}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
        toast({
          title: "Download started",
          description: isWatermarked ? "Preview saved to your device." : "HD image saved to your device.",
        })
      } catch (error) {
        console.error("[dashboard] download failed", error)
        toast({
          title: "Download failed",
          description: "Please try again in a moment.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  useEffect(() => {
    if (DEV_MODE_CLIENT) {
      return
    }

    let cancelled = false

    const syncProfile = async () => {
      if (!user?.id) return

      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session?.access_token) {
          return
        }

        const response = await fetch("/api/auth/sync-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload?.ok) {
          const message = payload?.error ?? "Unable to load profile."
          throw new Error(message)
        }

        if (cancelled) {
          return
        }

        if (typeof payload.plan === "string") {
          setPlan((payload.plan as PlanTier) ?? "free")
        }

        if (typeof payload.credits === "number") {
          setCredits(Math.max(payload.credits, 0))
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        console.error("[dashboard] profile sync failed", error)
        toast({
          title: "Profile sync failed",
          description: error instanceof Error ? error.message : "Unable to load credits.",
          variant: "destructive",
        })
      }
    }

    void syncProfile()

    return () => {
      cancelled = true
    }
  }, [supabaseClient, toast, user?.id])


  useEffect(() => {
    void fetchGenerations()
  }, [fetchGenerations])

  const handleGenerate = useCallback(
    async (settings: GenerationSettings): Promise<string | null> => {
      const isAdvancedMode = settings.mode === "advanced"

      if (!DEV_MODE_CLIENT && credits <= 0) {
        toast({
          title: "Out of credits",
          description:
            plan === "free"
              ? "You’ve used your 2 free credits. Upgrade to Pro for more."
              : "You’ve used all your credits. Recharge or upgrade to continue.",
          variant: "destructive",
        })
        return null
      }

      if (!DEV_MODE_CLIENT && plan === "free" && isAdvancedMode) {
        toast({
          title: "Upgrade for dual uploads",
          description: "Pro plans unlock model photo uploads and HD outputs.",
          variant: "destructive",
        })
        return null
      }

      if (!settings.garmentImageUrl) {
        toast({
          title: "Product image required",
          description: "Upload the product photo before generating.",
          variant: "destructive",
        })
        return null
      }

      if (isAdvancedMode && !settings.modelImageUrl) {
        toast({
          title: "Model image required",
          description: "Upload your model reference or switch to Basic mode.",
          variant: "destructive",
        })
        return null
      }

      const startedAt = Date.now()
      let latestOutputUrl: string | null = null
      setIsGenerating(true)
      toast({
        title: "Processing your AI try-on…",
        description: "We’ll ping you as soon as your look is ready.",
        duration: 3000,
      })

      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session) {
          toast({
            title: "Session expired",
            description: "Please log in again to continue generating.",
            variant: "destructive",
          })
          await supabaseClient.auth.signOut()
          router.push("/login")
          return null
        }

        const requestBody: Record<string, unknown> = {
          garmentImageUrl: settings.garmentImageUrl,
          styleType: settings.styleType,
          gender: settings.gender,
          ageGroup: settings.ageGroup,
          skinTone: settings.skinTone,
          aspectRatio: settings.aspectRatio,
          mode: settings.mode,
        }

        if (isAdvancedMode && settings.modelImageUrl) {
          requestBody.modelImageUrl = settings.modelImageUrl
        }

        const accessToken = session.access_token

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(requestBody),
          credentials: "include",
        })

        const payload = await response.json().catch(() => null)

        if (response.status === 401) {
          toast({
            title: "Session expired",
            description: "Sign in again to keep generating model shots.",
            variant: "destructive",
          })
          await supabaseClient.auth.signOut()
          router.replace("/login")
          router.refresh()
          return null
        }

        if (response.status === 402) {
          if (!DEV_MODE_CLIENT && typeof payload?.credits === "number") {
            setCredits(Math.max(payload.credits, 0))
          }
          toast({
            title: "Out of credits",
            description: "You’ve used all your credits. Upgrade to continue generating.",
            variant: "destructive",
          })
          return null
        }

        if (response.status === 403) {
          toast({
            title: "Pro plan required",
            description: "Upgrade to unlock dual-image Pro try-ons.",
            variant: "destructive",
          })
          return null
        }

        if (response.status === 400 && payload?.code === "POSE_DETECTION_FAILED") {
          toast({
            title: "Body not detected in photo",
            description: "Try a full-body image with the person standing upright against a simple background.",
          })
          return "POSE_DETECTION_FAILED"
        }

        const extractErrorMessage = () => {
          if (payload && typeof payload.message === "string" && payload.message.trim().length > 0) {
            return payload.message
          }
          if (payload && typeof payload.error === "string" && payload.error.trim().length > 0) {
            return payload.error
          }
          return "Generation failed. Please try again."
        }

        if (response.status >= 500) {
          toast({
            title: "Generation failed",
            description: extractErrorMessage(),
            variant: "destructive",
          })
          return null
        }

        if (!response.ok) {
          toast({
            title: "Generation failed",
            description: extractErrorMessage(),
            variant: "destructive",
          })
          return null
        }

        const requestSuccessful = payload?.ok === true || payload?.success === true

        if (!payload || !requestSuccessful) {
          toast({
            title: "Generation failed",
            description: extractErrorMessage(),
            variant: "destructive",
          })
          return null
        }

        if (typeof payload.outputUrl !== "string") {
          throw new Error("No output returned from the generation service.")
        }

        const outputUrl = payload.outputUrl
        latestOutputUrl = outputUrl

        const nextPlan = (payload?.plan as PlanTier | undefined) ?? plan

        if (!DEV_MODE_CLIENT && payload?.plan) {
          setPlan(nextPlan)
        }

        if (DEV_MODE_CLIENT) {
          setCredits(DEV_MODE_CREDITS)
        } else if (typeof payload?.credits === "number") {
          setCredits(Math.max(payload.credits, 0))
        } else if (typeof payload?.creditsRemaining === "number") {
          setCredits(Math.max(payload.creditsRemaining, 0))
        } else {
          setCredits((previous) => Math.max(previous - 1, 0))
        }

        if (payload?.generation) {
          const mapped = mapGenerationRow({
            id: payload.generation.id,
            image_url: payload.generation.url,
            plan: payload.generation.plan,
            created_at: payload.generation.createdAt,
            metadata: payload.generation.metadata ?? null,
          })
          setGeneratedImages((previous) => [mapped, ...previous].slice(0, 20))
        } else {
          const mode = nextPlan === "free" ? "preview" : "hd"
          const fallback: GeneratedImage = {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : Date.now().toString(),
            url: outputUrl,
            urls: [outputUrl],
            mode,
            plan: nextPlan,
            timestamp: new Date(),
            settings: {
              styleType: settings.styleType,
              gender: settings.gender,
              ageGroup: settings.ageGroup,
              skinTone: settings.skinTone,
              aspectRatio: settings.aspectRatio,
            },
          }
          setGeneratedImages((previous) => [fallback, ...previous].slice(0, 20))
        }

        toast({
          title: "Render complete",
          description: "1 credit used.",
        })

        if (user?.id) {
          void fetchGenerations(user.id)
        }
      } catch (error) {
        console.error("[ERROR] generate request failed:", error)
        toast({
          title: "Something went wrong. Please try again.",
          description: error instanceof Error ? error.message : "Unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        const fashnEnabled =
          typeof process.env.NEXT_PUBLIC_FASHN_ENABLED === "string"
            ? process.env.NEXT_PUBLIC_FASHN_ENABLED === "true"
            : false
        const minDuration = fashnEnabled ? 0 : 900
        const elapsed = Date.now() - startedAt
        if (elapsed < minDuration) {
          await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed))
        }
        setIsGenerating(false)
      }

      return latestOutputUrl
    },
    [credits, plan, router, supabaseClient, toast, mapGenerationRow, fetchGenerations, user?.id],
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

  const currentModeLabel =
    plan === "free"
      ? "Free Preview Mode"
      : plan === "pro"
        ? "Pro Mode (HD dual-image try-on)"
        : "Studio Mode (HD + batch/API)"
  const latestImage = generatedImages[0] ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#080808] to-[#0b0b0b] text-white">
      <DashboardNav credits={credits} devMode={DEV_MODE_CLIENT} onProfileClick={() => setIsProfileOpen(true)} />

      <main className="mx-auto mt-10 mb-12 flex w-full max-w-screen-xl flex-col gap-8 px-6 pb-6 md:flex-row md:items-start lg:gap-12 lg:px-10">
        <section className="order-1 w-full space-y-6 md:order-1 md:flex-[0.6] lg:flex-[0.58]">
          <ModelGenerator
            onGenerate={handleGenerate}
            hasCredits={DEV_MODE_CLIENT ? true : credits > 0}
            modeLabel={currentModeLabel}
            onUpgradeClick={handleUpgradeClick}
            isPro={DEV_MODE_CLIENT ? true : plan !== "free"}
            plan={plan}
          />
        </section>

        <aside className="order-2 w-full space-y-6 border-t border-white/5 pt-6 md:order-2 md:border-t-0 md:border-l md:border-white/10 md:pl-8 md:pt-0 md:flex-[0.4] lg:pl-12">
          <LatestPreviewCard
            image={latestImage}
            isGenerating={isGenerating}
            onDownload={handleDownload}
          />
          <RecentGenerations
            images={generatedImages}
            isGenerating={isGenerating}
            onDownload={handleDownload}
          />
        </aside>
      </main>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-xl overflow-hidden border-white/10 bg-[#101010]/95 px-6 py-6 text-white shadow-[0_0_32px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:px-10">
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
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </SessionGuard>
  )
}
