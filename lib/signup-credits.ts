import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_FREE_CREDITS = 2
const DEV_MODE_CREDITS = 999
const isProduction = process.env.NODE_ENV === "production"
const RAW_DEV_MODE = process.env.DEV_MODE === "true"
const DEV_MODE_OVERRIDE = !isProduction && RAW_DEV_MODE

export const ALLOWED_EMAIL_PROVIDERS = [
  // Global leaders
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "aol.com",
  "yandex.com",
  "yandex.ru",
  "mail.ru",
  // United States ISPs & legacy providers
  "comcast.net",
  "verizon.net",
  "att.net",
  "bellsouth.net",
  "cox.net",
  "charter.net",
  // Germany
  "gmx.com",
  "gmx.de",
  "web.de",
  "t-online.de",
  "freenet.de",
  "posteo.de",
  "mailbox.org",
  "arcor.de",
  "o2online.de",
  // Broader EU
  "btinternet.com",
  "btopenworld.com",
  "virginmedia.com",
  "orange.fr",
  "wanadoo.fr",
  "laposte.net",
  "free.fr",
  "sfr.fr",
  "libero.it",
  "alice.it",
  "seznam.cz",
  "centrum.cz",
  "onet.pl",
  "wp.pl",
] as const

const allowedEmailProviders = new Set(ALLOWED_EMAIL_PROVIDERS)

export const EMAIL_PROVIDER_ERROR_MESSAGE =
  "This email provider is not supported. Please use a standard provider."

export function normalizeEmail(email: string): string {
  if (typeof email !== "string") {
    throw new Error("Email must be provided for normalization.")
  }

  const trimmed = email.trim().toLowerCase()
  const atIndex = trimmed.lastIndexOf("@")

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    throw new Error("Invalid email address.")
  }

  const rawLocalPart = trimmed.slice(0, atIndex)
  const rawDomain = trimmed.slice(atIndex + 1)

  let normalizedDomain = rawDomain
  if (normalizedDomain === "googlemail.com") {
    normalizedDomain = "gmail.com"
  }

  let normalizedLocalPart = rawLocalPart
  if (normalizedDomain === "gmail.com") {
    const plusIndex = normalizedLocalPart.indexOf("+")
    if (plusIndex !== -1) {
      normalizedLocalPart = normalizedLocalPart.slice(0, plusIndex)
    }
  }

  return `${normalizedLocalPart}@${normalizedDomain}`
}

export function getEmailDomain(normalizedEmail: string): string | null {
  const atIndex = normalizedEmail.lastIndexOf("@")
  if (atIndex === -1) return null
  const domain = normalizedEmail.slice(atIndex + 1)
  return domain || null
}

function isAllowedEmailProvider(normalizedEmail: string): boolean {
  const domain = getEmailDomain(normalizedEmail)
  if (!domain) return false
  return allowedEmailProviders.has(domain)
}

export function validateEmailProvider(normalizedEmail: string): boolean {
  return isAllowedEmailProvider(normalizedEmail)
}

export async function determineStartingCredits({
  supabase,
  normalizedEmail,
}: {
  supabase: SupabaseClient
  normalizedEmail: string
}): Promise<number> {
  if (DEV_MODE_OVERRIDE) {
    return DEV_MODE_CREDITS
  }

  const { data, error } = await supabase
    .from("signup_emails")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  if (data) {
    return 0
  }

  const { error: insertError } = await supabase.from("signup_emails").insert({ email: normalizedEmail })

  if (insertError) {
    const duplicateEmail = insertError.code === "23505"
    if (!duplicateEmail) {
      throw insertError
    }

    return 0
  }

  return DEFAULT_FREE_CREDITS
}
