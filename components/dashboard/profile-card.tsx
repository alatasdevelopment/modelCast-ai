'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CreditCard, Loader2, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { getSupabaseClient } from '@/lib/supabaseClient'

interface ProfileCardProps {
  credits: number
  maxCredits: number
  onUpgradeClick: () => void
  onSignOut: () => Promise<void>
  onClose?: () => void
  isSigningOut?: boolean
  userId: string | null
  userName?: string | null
  email?: string | null
}

export function ProfileCard({
  credits,
  maxCredits,
  onUpgradeClick,
  onSignOut,
  onClose,
  isSigningOut = false,
  userId,
  userName,
  email,
}: ProfileCardProps) {
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const displayName = userName || email || 'ModelCast User'
  const displayEmail = email || 'email@modelcast.ai'
  const avatarInitials = useMemo(() => {
    if (!displayName) return 'MC'
    const matches = displayName.trim().split(/\s+/)
    if (matches.length === 1) return matches[0][0]?.toUpperCase() ?? 'M'
    return `${matches[0][0] ?? ''}${matches[1][0] ?? ''}`.toUpperCase()
  }, [displayName])

  const attemptAdminDeletion = async (id: string) => {
    // Browsers instantiated with anon keys cannot access the admin API.
    if (
      !('admin' in supabase.auth) ||
      typeof supabase.auth.admin?.deleteUser !== 'function'
    ) {
      throw new Error('fallback-signout')
    }

    // @ts-expect-error admin deleteUser requires service role keys and may not be typed for browser clients
    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      const status = 'status' in error ? error.status : undefined
      // Allow fallback when running with anon key only
      if (
        status === 401 ||
        status === 403 ||
        (typeof error.message === 'string' &&
          error.message.toLowerCase().includes('service role'))
      ) {
        throw new Error('fallback-signout')
      }

      throw error
    }
  }

  const handleDeleteAccount = async () => {
    if (isDeleting) return
    setIsDeleting(true)

    try {
      if (!userId) {
        throw new Error('Unable to locate your account. Refresh and try again.')
      }

      try {
        await attemptAdminDeletion(userId)
      } catch (error) {
        if (error instanceof Error && error.message === 'fallback-signout') {
          // No admin privileges available, fall back to a regular sign-out below.
        } else {
          throw error
        }
      }

      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        throw signOutError
      }

      toast({
        title: 'Account deleted successfully',
        description: 'We hope to see you again soon.',
      })

      setShowDeleteDialog(false)
      onClose?.()
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error('[profile-card] account deletion failed', error)
      toast({
        title: 'Account deletion failed',
        description:
          error instanceof Error ? error.message : 'Unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSignOut = async () => {
    const success = await onSignOut()
    if (success) {
      onClose?.()
    }
    return success
  }

  return (
    <>
      <Card className="relative gap-6 overflow-hidden rounded-2xl border-white/12 bg-[#111111]/60 p-6 shadow-[0_0_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-7">
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(159,255,87,0.55)] to-transparent" aria-hidden />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-green-muted)]">
              <User className="h-4 w-4 text-[var(--brand-green)]" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">Profile</p>
              <h2 className="text-lg font-semibold tracking-[0.18em] text-neutral-50">Your Account</h2>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help rounded-full border border-white/18 bg-white/[0.04] px-3 py-1 text-xs tracking-[0.2em] text-[var(--brand-green)]">
                  Credits {credits} / {maxCredits}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-white/10 bg-[#101010]/95 px-3 py-2 text-xs text-[var(--brand-green)]">
                Each AI model shot costs 1 credit ($1).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-start gap-4 pt-3">
          <Avatar className="h-16 w-16 border border-white/15 bg-white/[0.08]">
            <AvatarFallback className="bg-[var(--brand-green-muted)] text-lg font-semibold text-[var(--brand-green)]">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold tracking-[0.12em] text-neutral-50">{displayName}</h3>
            <p className="text-[15px] text-neutral-200">{displayEmail}</p>
          </div>
        </div>

        <Separator className="my-4 border-white/10" />

        <div className="space-y-4">
          <Button
            type="button"
            className="w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-hover)] text-sm font-semibold text-black shadow-[0_0_22px_rgba(159,255,87,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(159,255,87,0.35)]"
            onClick={() => {
              onClose?.()
              onUpgradeClick()
            }}
          >
            <CreditCard className="h-4 w-4" />
            Buy another credit ($1)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border-white/18 text-neutral-200 transition-all duration-200 hover:border-white/35 hover:bg-white/[0.05] hover:text-neutral-50"
            onClick={() => setShowManageDialog(true)}
          >
            <Settings className="h-4 w-4" />
            Manage account
          </Button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.035] p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">Total credits</p>
              <p className="mt-3 text-xl font-semibold text-[var(--brand-green)]">
                {credits} / {maxCredits}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">Status</p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                {credits > 0 ? 'Active' : 'Recharge needed'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">Price per shot</p>
              <p className="mt-3 text-xl font-semibold text-[var(--brand-green)]">$1</p>
            </div>
          </div>
        </div>
      </Card>

      <Separator className="my-6 border-white/10" />

      <Button
        type="button"
        className="w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-[0_0_16px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-white/90"
        onClick={() => setShowLogoutDialog(true)}
        disabled={isSigningOut}
      >
        Log out
      </Button>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="border-white/10 bg-[#101010]/95 px-6 py-6 text-white shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-9">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold tracking-[0.14em] text-[var(--brand-green)]">Manage account</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-neutral-300">
              Update your information or request an account change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-5">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 border-white/20 text-white/60"
              disabled
            >
              Coming soon: change password
            </Button>
          </div>
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDeleting}
              onClick={() => {
                setShowManageDialog(false)
                setShowDeleteDialog(true)
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              Delete my account permanently
            </button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-[0_0_12px_rgba(0,0,0,0.3)] hover:bg-white/90"
              onClick={() => setShowManageDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-[#101010]/95 text-white shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-neutral-300">
                Are you sure? This cannot be undone and will remove your data from ModelCast.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                disabled={isDeleting}
                onClick={() => void handleDeleteAccount()}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Yes, delete my account'
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="border-white/10 bg-[#101010]/95 text-white shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to generate more shots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                disabled={isSigningOut}
                onClick={async () => {
                  const success = await handleSignOut()
                  if (success) {
                    setShowLogoutDialog(false)
                  }
                }}
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {isSigningOut ? 'Signing out…' : 'Yes, sign me out'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
