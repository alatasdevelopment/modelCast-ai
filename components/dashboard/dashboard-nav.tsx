'use client'

import Link from 'next/link'

import { Logo } from '@/components/logo'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PlanTier } from '@/components/dashboard/types'

interface DashboardNavProps {
  credits: number
  maxCredits: number
  onProfileClick: () => void
  plan?: PlanTier
}

export function DashboardNav({
  credits,
  maxCredits,
  onProfileClick,
  plan = 'free',
}: DashboardNavProps) {
  const planLabel =
    plan === 'free'
      ? `Free plan · ${maxCredits} preview credits`
      : `${plan === 'pro' ? 'Pro' : 'Studio'} plan · ${maxCredits} credits / month`

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start justify-between gap-4 px-6 py-4 sm:h-20 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/" className="flex items-center gap-3 text-neutral-50">
          <Logo className="h-10 w-10" sizes="(max-width: 768px) 2.5rem, 2.5rem" />
          <span className="text-lg font-semibold tracking-[0.035em]">ModelCast</span>
        </Link>

        <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto sm:flex-nowrap sm:gap-5">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex flex-shrink-0 items-center gap-3 rounded-full border border-white/25 bg-white/[0.04] px-3 py-1.5 text-left text-xs tracking-[0.02em] text-neutral-200 backdrop-blur transition-colors hover:border-white/40 hover:text-neutral-50 sm:px-4 sm:py-2 sm:text-sm md:text-base"
                  aria-label="Available credits"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${credits > 0 ? 'bg-[var(--brand-green)]' : 'bg-yellow-400'}`}
                  />
                  <div className="flex flex-col items-center leading-tight text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-green)] leading-none">
                      Credits
                    </span>
                    <span className="text-[11px] font-medium text-neutral-200 leading-none">
                      {credits} / {maxCredits}
                    </span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-white/10 bg-[#101010]/95 px-4 py-3 text-[var(--brand-green)]">
                <div className="space-y-1 text-xs">
                  <p>{planLabel}</p>
                  <p>
                    {credits} / {maxCredits} credits remaining.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button
            type="button"
            onClick={onProfileClick}
            className="group relative flex-shrink-0 text-sm font-medium uppercase tracking-[0.18em] text-neutral-300 transition hover:text-[var(--brand-green)]"
          >
            Profile
            <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] origin-center scale-x-0 bg-gradient-to-r from-transparent via-[var(--brand-green)] to-transparent transition-transform duration-200 ease-out group-hover:scale-x-100" />
          </button>
        </div>
      </div>
    </nav>
  )
}
