'use client'

import { useMemo, useState, useEffect } from 'react'
import { AlertTriangle, CreditCard, Loader2, Settings, User, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'

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
  devMode?: boolean
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
  devMode = false,
}: ProfileCardProps) {
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const router = useRouter()
  const supabaseClient = useMemo(() => getSupabaseClient(), [])

  const displayName = userName || email || 'ModelCast User'
  const displayEmail = email || 'email@modelcast.ai'
  const creditSummary = devMode ? '∞ (Dev Mode)' : `${credits} / ${maxCredits}`
  const creditsDisplayValue = devMode ? '∞' : `${credits} / ${maxCredits}`
  const creditsDisplaySuffix = devMode ? '(Dev Mode)' : null
  const statusLabel = devMode ? 'Dev sandbox' : credits > 0 ? 'Active' : 'Recharge needed'
  const tooltipMessage = devMode
    ? 'Dev Mode: credits are unlimited for local testing.'
    : 'Each AI model shot costs 1 credit ($1).'
  const avatarInitials = useMemo(() => {
    if (!displayName) return 'MC'
    const matches = displayName.trim().split(/\s+/)
    if (matches.length === 1) return matches[0][0]?.toUpperCase() ?? 'M'
    return `${matches[0][0] ?? ''}${matches[1][0] ?? ''}`.toUpperCase()
  }, [displayName])

  const handleDeleteAccount = async () => {
    if (isDeleting) return
    setIsDeleting(true)

    try {
      if (!userId) {
        throw new Error('Unable to locate your account. Refresh and try again.')
      }

      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message =
          typeof data?.error === 'string'
            ? data.error
            : 'Unable to delete your account at the moment. Please try again.'
        throw new Error(message)
      }

      const { error: signOutError } = await supabaseClient.auth.signOut()
      if (signOutError) {
        throw signOutError
      }

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted. We hope to see you again.',
      })

      setShowManageDialog(false)
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

  const handlePasswordChange = async () => {
    if (newPassword.length < 6 || isUpdatingPassword) return
    setIsUpdatingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message || 'Unable to update password.')
        return
      }
      setPasswordSuccess(true)
      setShowPasswordForm(false)
      setNewPassword('')
    } catch (error) {
      setPasswordError('Unexpected error. Please try again.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  useEffect(() => {
    if (!showPasswordForm) {
      setNewPassword('')
      setPasswordError(null)
    }
  }, [showPasswordForm])

  return (
    <>
      <Card className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-green-muted)]">
              <User className="h-4 w-4 text-[var(--brand-green)]" />
            </span>
            <div>
              <p className="text-[0.78rem] font-medium text-neutral-500">Profile</p>
              <h2 className="text-lg font-semibold text-white">Your Account</h2>
              <p className="text-sm text-gray-400">Manage your profile, plan, and account actions.</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-default rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1 text-xs text-gray-400">
                  Credits <span className="text-gray-200">{creditsDisplayValue}</span>
                  {creditsDisplaySuffix ? <span className="ml-1 text-lime-400/70">{creditsDisplaySuffix}</span> : null}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-white/10 bg-[#101010]/95 px-3 py-2 text-xs text-[var(--brand-green)]">
                {tooltipMessage}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <Avatar className="h-14 w-14 border border-white/10 bg-white/[0.08]">
            <AvatarFallback className="bg-[var(--brand-green-muted)] text-lg font-semibold text-[var(--brand-green)]">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold tracking-[0.12em] text-neutral-50">{displayName}</h3>
            <p className="text-[15px] text-neutral-200">{displayEmail}</p>
          </div>
        </div>

        <Separator className="my-3 border-white/10" />

        <div className="space-y-3">
          <Button
            type="button"
            className="w-full justify-start gap-2 rounded-xl bg-lime-400 py-3 text-sm font-medium text-black transition hover:bg-lime-300"
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
            className="w-full justify-start gap-2 rounded-xl border border-neutral-700 py-3 text-sm font-medium text-gray-300 transition hover:border-neutral-500 hover:text-white"
            onClick={() => setShowManageDialog(true)}
          >
            <Settings className="h-4 w-4" />
            Manage account
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border border-neutral-800 py-3 text-sm font-medium text-gray-300 transition hover:border-neutral-600 hover:text-white"
            onClick={() => {
              setShowPasswordForm((prev) => !prev)
              setPasswordSuccess(false)
            }}
          >
            <Lock className="h-4 w-4" />
            Change password
          </Button>
          {showPasswordForm ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-2">
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  setPasswordSuccess(false)
                }}
                className="border-neutral-800 bg-neutral-950/60 text-sm text-gray-200 placeholder:text-neutral-500 focus-visible:ring-neutral-600"
              />
              <Button
                type="button"
                className="w-full rounded-lg bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={handlePasswordChange}
                disabled={newPassword.length < 6 || isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Save password'
                )}
              </Button>
              {passwordError ? <p className="text-sm text-red-400">{passwordError}</p> : null}
            </div>
          ) : null}
          {passwordSuccess ? <p className="text-sm text-lime-400">Password updated successfully.</p> : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 text-center md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-2.5">
            <p className="text-[0.72rem] font-medium text-gray-500">Total credits</p>
            <p className="text-sm font-medium text-gray-200">{creditSummary}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-2.5">
            <p className="text-[0.72rem] font-medium text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-200">{statusLabel}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-2.5">
            <p className="text-[0.72rem] font-medium text-gray-500">Price per shot</p>
            <p className="text-sm font-medium text-lime-400">$1</p>
          </div>
        </div>
      </Card>

      <Separator className="my-5 border-white/10" />

      <Button
        type="button"
        variant="ghost"
        className="mt-3 w-full justify-center rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-gray-400 transition hover:border-neutral-500 hover:text-white"
        onClick={() => setShowLogoutDialog(true)}
        disabled={isSigningOut}
      >
        Log out
      </Button>

      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full justify-center gap-2 rounded-xl border-red-500/30 bg-red-500/5 text-sm font-semibold text-red-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-500/10 hover:text-red-200"
        onClick={() => setShowDeleteDialog(true)}
        disabled={isDeleting}
      >
        <AlertTriangle className="h-4 w-4" />
        Delete my account
      </Button>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="border-white/10 bg-[#101010]/95 px-6 py-6 text-white shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-9">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold tracking-[0.14em] text-[var(--brand-green)]">Manage account</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-neutral-300">
              Update your information or request an account change.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3" />
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
            <AlertDialogCancel className="rounded-lg border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-white/15 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                className="gap-2 rounded-lg bg-red-500/90 text-sm font-semibold text-white shadow-[0_0_18px_rgba(255,0,0,0.25)] transition hover:bg-red-500"
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
                className="gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-lime-300"
                disabled={isSigningOut}
                onClick={async () => {
                  const success = await handleSignOut()
                  if (success) {
                    setShowLogoutDialog(false)
                  }
                }}
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
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
