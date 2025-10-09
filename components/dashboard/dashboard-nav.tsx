'use client'

import Link from 'next/link'
import { LogOut, Loader2 } from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

interface DashboardNavProps {
  credits: number
  onSignOut: () => Promise<void>
  isSigningOut?: boolean
}

export function DashboardNav({
  credits,
  onSignOut,
  isSigningOut = false,
}: DashboardNavProps) {
  const handleLogout = async () => {
    await onSignOut()
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-4 sm:h-20 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-0">
        <Link href="/" className="flex items-center gap-3 text-neutral-50">
          <Logo className="h-10 w-10" sizes="(max-width: 768px) 2.5rem, 2.5rem" />
          <span className="text-lg font-semibold tracking-[0.035em]">ModelCast</span>
        </Link>

        <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto sm:flex-nowrap sm:gap-5">
          <div className="flex flex-shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs tracking-[0.02em] text-neutral-300 backdrop-blur sm:px-4 sm:py-2 sm:text-sm md:text-base">
            <span
              className={`h-2 w-2 rounded-full ${credits > 0 ? 'bg-[#00ff87]' : 'bg-yellow-400'}`}
            />
            <div className="flex items-baseline gap-1 font-medium">
              <span className="text-neutral-400">Credits</span>
              <span className="font-semibold text-[#6bffaf]">{credits}</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-2 border-white/25 text-neutral-300 tracking-[0.03em] transition-all duration-200 hover:border-white/40 hover:text-white"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out…
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
}
