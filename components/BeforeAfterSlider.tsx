"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

type BeforeAfterSliderProps = {
  beforeSrc: string
  afterSrc: string
  beforeAlt?: string
  afterAlt?: string
  initial?: number
  aspectRatio?: string
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before image",
  afterAlt = "After image",
  initial = 0.5,
  aspectRatio = "1 / 1",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(() => clamp(initial))
  const positionRef = useRef(position)
  const rafRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const pendingPositionRef = useRef(position)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    setPosition(clamp(initial))
  }, [initial])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const schedulePositionUpdate = useCallback((next: number) => {
    pendingPositionRef.current = clamp(next)
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const nextValue = pendingPositionRef.current
      if (nextValue !== positionRef.current) {
        positionRef.current = nextValue
        setPosition(nextValue)
      }
    })
  }, [])

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      if (rect.width === 0) return
      const next = (clientX - rect.left) / rect.width
      schedulePositionUpdate(next)
    },
    [schedulePositionUpdate],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (hasError) return
      isDraggingRef.current = true
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      updateFromClientX(event.clientX)
    },
    [hasError, updateFromClientX],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      updateFromClientX(event.clientX)
    },
    [updateFromClientX],
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (hasError) return
    const step = 0.02
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      schedulePositionUpdate(positionRef.current - step)
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      schedulePositionUpdate(positionRef.current + step)
    }
  }, [hasError, schedulePositionUpdate])

  const handleImageError = useCallback(() => {
    setHasError(true)
  }, [])

  const percent = `${position * 100}%`

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden rounded-3xl border border-white/10 bg-black/70 shadow-[0_24px_60px_rgba(0,0,0,0.55)] touch-pan-y"
        style={{ aspectRatio }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="group"
        aria-label="Before and after comparison"
      >
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-300">
            Unable to load demo imagery. Please check back soon.
          </div>
        ) : (
          <>
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src={beforeSrc}
                alt={beforeAlt}
                fill
                className="object-cover select-none"
                sizes="(max-width: 768px) 90vw, 520px"
                draggable={false}
                onError={handleImageError}
              />
            </div>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - position * 100}% 0 0)` }}
            >
              <Image
                src={afterSrc}
                alt={afterAlt}
                fill
                className="object-cover select-none"
                sizes="(max-width: 768px) 90vw, 520px"
                draggable={false}
                onError={handleImageError}
              />
            </div>

            <div
              className="absolute inset-y-0"
              style={{ left: percent, transform: "translateX(-50%)" }}
            >
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/70 shadow-[0_0_12px_rgba(0,0,0,0.6)]" />
              <div
                role="slider"
                tabIndex={0}
                aria-label="Comparison handle"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(position * 100)}
                aria-valuetext={`${Math.round(position * 100)}%`}
                aria-orientation="horizontal"
                className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white shadow-[0_0_18px_rgba(0,0,0,0.65)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:h-9 sm:w-9"
                onKeyDown={handleKeyDown}
              >
                <div className="flex items-center gap-1 text-xs font-semibold text-white/80">
                  <span className="h-4 w-[2px] rounded-full bg-white/80" />
                  <span className="h-4 w-[2px] rounded-full bg-white/80" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
