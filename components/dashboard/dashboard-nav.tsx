'use client'

import Link from 'next/link'

import { CreditIndicator } from '@/components/dashboard/credit-indicator'
import { Logo } from '@/components/logo'

interface DashboardNavProps {
  credits: number
  onProfileClick: () => void
  devMode?: boolean
}

export function DashboardNav({ credits, onProfileClick, devMode = false }: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start justify-between gap-4 px-6 py-4 sm:h-20 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/" className="flex items-center gap-3 text-neutral-50">
          <Logo className="h-10 w-10" sizes="(max-width: 768px) 2.5rem, 2.5rem" />
          <span className="text-lg font-semibold tracking-[0.035em]">ModelCast</span>
        </Link>

        <div className="ml-auto flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <CreditIndicator credits={credits} devMode={devMode} className="border-white/20 bg-white/[0.06]" />
          <button
            type="button"
            onClick={onProfileClick}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-neutral-200 transition hover:border-[var(--brand-green)] hover:text-white"
          >
            Profile
          </button>
        </div>
      </div>
    </nav>
  )
}
