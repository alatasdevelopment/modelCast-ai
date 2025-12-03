'use client'

import { cn } from '@/lib/utils'

interface CreditIndicatorProps {
  credits: number
  devMode?: boolean
  size?: 'default' | 'compact'
  className?: string
}

interface CreditSummaryOptions {
  devMode?: boolean
}

export function getCreditSummary(credits: number, { devMode = false }: CreditSummaryOptions = {}) {
  if (devMode) {
    return 'Unlimited credits'
  }

  if (credits <= 0) {
    return 'No credits'
  }

  return `${credits} credit${credits === 1 ? '' : 's'}`
}

export function CreditIndicator({
  credits,
  devMode = false,
  size = 'default',
  className,
}: CreditIndicatorProps) {
  const hasBalance = devMode || credits > 0
  const label = getCreditSummary(credits, { devMode })

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] text-white shadow-[0_0_22px_rgba(0,0,0,0.35)]',
        size === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        className,
      )}
    >
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          hasBalance ? 'bg-[var(--brand-green)] shadow-[0_0_8px_rgba(139,255,144,0.75)]' : 'bg-amber-400',
        )}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50">Credits</span>
        <span className={cn(size === 'compact' ? 'text-[0.85rem]' : 'text-sm', 'font-semibold tracking-tight')}>
          {label}
        </span>
      </div>
    </div>
  )
}
