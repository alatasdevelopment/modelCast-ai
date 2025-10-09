import Image from "next/image"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  priority?: boolean
  sizes?: string
}

export function Logo({
  className,
  priority = false,
  sizes = "(max-width: 640px) 2.25rem, (max-width: 1280px) 2.5rem, 2.5rem",
}: LogoProps) {
  return (
    <div
      className={cn(
        "relative h-10 w-10 md:h-10 md:w-10",
        "flex items-center justify-center",
        className,
      )}
    >
      <Image
        src="/logos/logo.svg"
        alt="ModelCast Logo"
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </div>
  )
}
