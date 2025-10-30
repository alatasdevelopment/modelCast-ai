"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { ModelGenerator, type GenerationSettings } from "@/components/dashboard/model-generator"
import { RecentGenerations } from "@/components/dashboard/recent-generations"
import { LatestPreviewCard } from "@/components/dashboard/latest-preview-card"
import type { GeneratedImage, PlanTier } from "@/components/dashboard/types"
import { SessionGuard } from "@/components/auth/session-guard"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const PLAN_LIMITS_MAP: Record<PlanTier, number> = {
  free: 2,
  pro: 30,
  studio: 150,
}

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
  const [credits, setCredits] = useState<number>(DEV_MODE_CLIENT ? DEV_MODE_CREDITS : PLAN_LIMITS_MAP.free)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const supabaseClient = useMemo(() => getSupabaseClient(), [])

  type GenerationRow = {
    id: string
    image_url: string
    plan: string | null
    created_at: string | null
    metadata?: {
      form?: Record<string, unknown> | null
      delivery?: string | null
    } | null
  }

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
        console.log("[DEBUG] Fetching session before generations...")
        const sessionResponse = await supabaseClient.auth.getSession()
        console.log("[DEBUG] Session response:", sessionResponse)

        const {
          data: { user: sessionUser },
          error: userError,
        } = await supabaseClient.auth.getUser()
        console.log("[DEBUG] getUser() result:", { sessionUser, userError })

        if (userError) {
          console.error("[dashboard] failed to resolve session before loading generations", userError)
          return
        }

        if (!sessionUser?.id) {
          console.warn("[DEBUG] No user found, aborting generations fetch.")
          return
        }

        targetUserId = sessionUser.id
      }

      if (!targetUserId) {
        console.warn("[DEBUG] Unable to determine authenticated user — skipping generations fetch.")
        return
      }

      console.log("[DEBUG] Direct Supabase instance:", supabaseClient)
      console.log("[DEBUG] Initiating generations fetch...")

      const { data, error } = await supabaseClient
        .from("generations")
        .select<GenerationRow>("id, image_url, plan, created_at, metadata")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false, nullsLast: true })
        .limit(20)

      let finalRows = (data as GenerationRow[] | null) ?? null
      let rpcData: GenerationRow[] | null = null

      if (error) {
        console.error("[dashboard] failed to load generations", error)
        const {
          data: rpcResponseData,
          error: rpcError,
        } = await supabaseClient.rpc<GenerationRow[] | null>("get_generations_safe", {
          p_user_id: targetUserId,
        })

        if (rpcError) {
          console.error("[dashboard] RPC fallback failed", rpcError)
          return
        }

        if (rpcResponseData) {
          console.warn("[FALLBACK] Generations loaded via RPC fallback.")
          rpcData = rpcResponseData
          finalRows = rpcData
        }
      }

      if (finalRows) {
        setGeneratedImages(finalRows.map(mapGenerationRow))
        console.log("[SUCCESS] Generations loaded:", data?.length || rpcData?.length || 0)
      }
    },
    [mapGenerationRow, supabaseClient],
  )

  const fullName = useMemo(() => {
    const maybeName = user?.user_metadata?.full_name
    return typeof maybeName === "string" && maybeName.trim().length > 0 ? maybeName : null
  }, [user?.user_metadata?.full_name])

  const handleUpgradeClick = useCallback(() => setShowUpgradeModal(true), [])

  useEffect(() => {
    let isMounted = true
    const fetchProfile = async () => {
      if (!user?.id) return

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("credits, is_pro, is_studio, plan")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("[dashboard] failed to load profile", error)
        toast({
          title: "Profile data unavailable",
          description: "We couldn't load your plan info. Some features may be limited.",
          variant: "destructive",
        })
        return
      }

      if (isMounted && data) {
        if (DEV_MODE_CLIENT) {
          setPlan("pro")
          setCredits(DEV_MODE_CREDITS)
          return
        }
        const detectedPlan = resolvePlanTier(data.plan ?? null, data.is_pro ?? null, data.is_studio ?? null)
        const planLimit = PLAN_LIMITS_MAP[detectedPlan]
        const normalizedCredits = Math.min(
          Math.max(typeof data.credits === "number" ? data.credits : planLimit, 0),
          planLimit,
        )

        setPlan(detectedPlan)
        setCredits(normalizedCredits)
      }
    }

    void fetchProfile()

    return () => {
      isMounted = false
    }
  }, [supabaseClient, toast, user?.id])

  useEffect(() => {
    console.log("[DEBUG] Supabase client origin check:", supabaseClient)
  }, [supabaseClient])

  useEffect(() => {
    void fetchGenerations()
  }, [fetchGenerations])

  const handleGenerate = useCallback(
    async (settings: GenerationSettings): Promise<string | null> => {
      const isAdvancedMode = settings.mode === "advanced"

      const planLimit = DEV_MODE_CLIENT ? DEV_MODE_CREDITS : PLAN_LIMITS_MAP[plan]

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
          title: "Garment image required",
          description: "Upload the garment photo before generating.",
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

        if (response.status >= 500) {
          const errorMessage =
            (payload && typeof payload.error === "string" && payload.error) || "Generation failed. Please try again."
          toast({
            title: "Generation failed",
            description: errorMessage,
            variant: "destructive",
          })
          return null
        }

        if (!response.ok) {
          const message =
            (payload && typeof payload.error === "string" && payload.error) ||
            "Generation failed. Please try again."
          throw new Error(message)
        }

        if (!payload || payload.success !== true) {
          const message =
            (payload && typeof payload.error === "string" && payload.error) ||
            "Generation failed. Please try again."
          toast({
            title: "Generation failed",
            description: message,
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
        const nextPlanLimit = DEV_MODE_CLIENT ? DEV_MODE_CREDITS : PLAN_LIMITS_MAP[nextPlan]

        if (!DEV_MODE_CLIENT && payload?.plan) {
          setPlan(nextPlan)
        }

        if (DEV_MODE_CLIENT) {
          setCredits(DEV_MODE_CREDITS)
        } else if (payload && typeof payload.creditsRemaining === "number") {
          setCredits(Math.min(Math.max(payload.creditsRemaining, 0), nextPlanLimit))
        } else {
          setCredits((previous) => Math.min(Math.max(previous - 1, 0), planLimit))
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
        console.error("[dashboard] generate prediction failed", error)
        toast({
          title: "Generation failed. Please try again.",
          description:
            error instanceof Error ? error.message : "Unexpected error occurred.",
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

  const totalCredits = DEV_MODE_CLIENT ? DEV_MODE_CREDITS : PLAN_LIMITS_MAP[plan]
  const currentModeLabel =
    plan === "free"
      ? "Free Preview Mode (watermarked)"
      : plan === "pro"
        ? "Pro Mode (HD dual-image try-on)"
        : "Studio Mode (HD + batch/API)"
  const latestImage = generatedImages[0] ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#080808] to-[#0b0b0b] text-white">
      <DashboardNav
        credits={credits}
        maxCredits={totalCredits}
        plan={plan}
        devMode={DEV_MODE_CLIENT}
        onProfileClick={() => setIsProfileOpen(true)}
      />

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
          <LatestPreviewCard image={latestImage} isGenerating={isGenerating} />
          <RecentGenerations images={generatedImages} isGenerating={isGenerating} />
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
              maxCredits={totalCredits}
              devMode={DEV_MODE_CLIENT}
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
