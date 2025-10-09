"use client"

import { useEffect, useRef, useState } from "react"

interface LazyVideoProps {
  src: string
  className?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  "aria-label"?: string
}

export default function LazyVideo({
  src,
  className = "",
  autoplay = true,
  loop = true,
  muted = true,
  playsInline = true,
  "aria-label": ariaLabel,
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            if (videoRef.current && autoplay) {
              videoRef.current.play().catch(() => {
                // Autoplay was prevented, ignore the error
              })
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause()
            }
          }
        })
      },
      { threshold: 0.1 },
    )

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current)
      }
    }
  }, [autoplay])

  return (
    <video
      ref={videoRef}
      className={className}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      aria-label={ariaLabel}
    >
      {isInView && <source src={src} type="video/mp4" />}
    </video>
  )
}
