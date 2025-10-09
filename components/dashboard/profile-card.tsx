'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CreditCard, Settings, User } from 'lucide-react'

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
import { toast } from '@/hooks/use-toast'

interface ProfileCardProps {
  credits: number
  userName?: string | null
  email?: string | null
}

export function ProfileCard({ credits, userName, email }: ProfileCardProps) {
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const displayName = userName || email || 'ModelCast User'
  const displayEmail = email || 'email@modelcast.ai'
  const avatarInitials = useMemo(() => {
    if (!displayName) return 'MC'
    const matches = displayName.trim().split(/\s+/)
    if (matches.length === 1) return matches[0][0]?.toUpperCase() ?? 'M'
    return `${matches[0][0] ?? ''}${matches[1][0] ?? ''}`.toUpperCase()
  }, [displayName])

  const handleDeleteAccount = () => {
    toast({
      title: 'Account deletion coming soon',
      description: 'Self-serve deletion is almost ready. We will notify you as soon as it is available.',
    })
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="relative gap-6 rounded-xl border-white/10 bg-white/[0.04] p-4 shadow-[0_0_25px_#00FF87]/10 backdrop-blur-xl sm:p-6 lg:p-8">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-[#00ff87] to-transparent" aria-hidden />

        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ff87]/10">
            <User className="h-4 w-4 text-[#00ff87]" />
          </span>
          <h2 className="text-lg font-semibold tracking-[0.015em] text-neutral-50">Your Account</h2>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Avatar className="h-16 w-16 border border-white/15 bg-white/[0.08]">
            <AvatarFallback className="bg-[#00ff87]/18 text-lg font-semibold text-[#00ff87]">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold tracking-[0.015em] text-neutral-50">{displayName}</h3>
            <p className="text-base text-neutral-200">{displayEmail}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border-white/20 text-neutral-200 transition-all duration-200 hover:border-white/35 hover:text-neutral-50"
            onClick={() => setShowManageDialog(true)}
          >
            <Settings className="h-4 w-4" />
            Manage account
          </Button>
          {credits === 0 ? (
            <Button
              type="button"
              className="w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#a6ff00] text-base font-semibold text-black shadow-[0_0_20px_#00FF87]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_#00FF87]/40"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade plan
            </Button>
          ) : null}
        </div>

        <div className="mt-5 rounded-xl border border-white/12 bg-white/[0.03] p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-[#64ffae]">{credits}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Credits left
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-100">Starter</p>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Current plan
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="border-white/12 bg-black/85 px-6 py-6 text-white backdrop-blur-2xl sm:px-8">
          <DialogHeader>
            <DialogTitle>Manage account</DialogTitle>
            <DialogDescription>
              Update your information or request an account change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 border-white/20 text-white/60"
              disabled
            >
              Coming soon: change password
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => {
                setShowManageDialog(false)
                setShowDeleteDialog(true)
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              Delete my account
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowManageDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/12 bg-black/85 text-white backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your data will be permanently removed when account deletion support goes live. Contact support if you need immediate assistance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
