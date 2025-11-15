"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Lock, Sparkles, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const totalSpots = 100
const spotsTaken = 53

const perks = [
  {
    icon: Lock,
    title: "Founding Pricing Lock",
    description: "Lock in discounted credit rates during beta. Your early pricing stays fixed after launch.",
  },
  {
    icon: Zap,
    title: "Priority Generation",
    description: "Jump the public queue, test new body models first, and keep your shoots moving fast.",
  },
  {
    icon: Users,
    title: "Creator Circle",
    description: "Work directly with the team—share feedback, influence the roadmap, and co-build features.",
  },
]
export function EarlyAccessSection() {
  const [email, setEmail] = useState("")
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast({
        title: "Enter a valid email",
        description: "We need your best contact to reserve your spot.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message ?? "Something went wrong.")
      }

      toast({
        title: "You're in! We'll notify you soon.",
      })
      setEmail("")
    } catch (error) {
      console.error("[EARLY_ACCESS_JOIN_ERROR]", error)
      toast({
        title: "Unable to save your email",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="early-access" role="region" aria-labelledby="early-access-heading" className="relative py-24 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(166,255,0,0.12),_transparent_55%)] pointer-events-none" />
      <div className="relative max-w-[1100px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-black/60 px-4 py-2 text-sm font-semibold text-lime-200 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Early Access
          </motion.div>

          <motion.h2
            id="early-access-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
          >
            Reserve Your Founding Spot
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/70 max-w-2xl mx-auto mb-12"
          >
            Secure priority access, lock in your credit pricing, and help shape ModelCast before the public launch.
          </motion.p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12 text-left">
            {perks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-lime-300/30 hover:bg-neutral-900/80 hover:scale-[1.01] transition"
              >
                <perk.icon className="w-6 h-6 text-lime-300 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{perk.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{perk.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 text-base font-medium text-white mb-3">
              <span className="h-2 w-2 rounded-full bg-lime-300" />
              <span>
                {spotsTaken} / {totalSpots} spots claimed
              </span>
            </div>
            <div className="max-w-md mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime-400 to-lime-200"
                initial={{ width: "0%" }}
                whileInView={{ width: "53%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-4"
          >
            <Button
              variant="lime"
              className="w-full sm:w-auto text-base px-8 py-4 font-semibold shadow-[0_0_12px_rgba(163,255,88,0.25)] hover:shadow-[0_0_18px_rgba(163,255,88,0.35)]"
              aria-label="Join the ModelCast Early Access list"
              onClick={() => setIsFormVisible(true)}
            >
              Join the Early Access List
              <ArrowRight className="w-4 h-4" />
            </Button>

            {isFormVisible ? (
              <form
                onSubmit={handleJoin}
                className="mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-left sm:flex-row sm:items-center"
              >
                <label className="sr-only" htmlFor="early-access-email">
                  Email address
                </label>
                <input
                  id="early-access-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
                <Button
                  type="submit"
                  variant="lime"
                  className="w-full rounded-xl px-6 py-3 text-sm font-semibold sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Join"}
                </Button>
              </form>
            ) : null}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 text-sm text-white/50"
          >
            No credit card required · Cancel anytime · Privacy guaranteed
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
