const ALLOWED_EMAIL_PROVIDERS = [
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
]

export function normalizeEmail(raw: string): string {
  let email = raw.trim().toLowerCase()
  const [local, domain] = email.split("@")

  if (!local || !domain) return email

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plusIndex = local.indexOf("+")
    const cleanedLocal = plusIndex === -1 ? local : local.slice(0, plusIndex)
    email = `${cleanedLocal}@gmail.com`
  }

  return email
}

export function isAllowedProvider(email: string): boolean {
  const normalized = normalizeEmail(email)
  const [, domain] = normalized.split("@")
  if (!domain) return false
  return ALLOWED_EMAIL_PROVIDERS.includes(domain)
}
