"use client"

import Image from "next/image"

interface LiquidGlassCardProps {
  title?: string
  sub?: string
  tone?: string
  imageSrc?: string
  colorFilter?: string
}

export default function LiquidGlassCard({
  title = "Studio",
  sub = "Professional model shots",
  tone = "premium",
  imageSrc,
  colorFilter = "",
}: LiquidGlassCardProps) {
  return (
    <div className="group relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-3 hover:border-[#A6FF00]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(166,255,0,0.3)] hover:-translate-y-2">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-[#A6FF00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black">
        <Image
          src={imageSrc ?? "/placeholder.svg?height=800&width=400&query=fashion model professional"}
          alt={`${title} - ${sub}`}
          fill
          className={`object-cover transition-all duration-700 group-hover:scale-110 ${colorFilter}`}
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="text-2xl font-bold text-white">{title}</div>
          <p className="text-xs text-white/70 leading-relaxed">{sub}</p>
          <div className="inline-flex items-center rounded-full bg-[#A6FF00]/20 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider text-[#A6FF00] font-semibold border border-[#A6FF00]/30">
            {tone}
          </div>
        </div>
      </div>
    </div>
  )
}
