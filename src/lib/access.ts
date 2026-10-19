/** Only corporate mailboxes may unlock the site / submit feedback. */
export const ALLOWED_EMAIL_DOMAIN = '221e.space'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Accepts only addresses whose domain is exactly `221e.space`
 * (rejects gmail.com, subdomains like mail.221e.space, spoofed suffixes).
 */
export function isAllowedCorporateEmail(email: string): boolean {
  const normalized = normalizeEmail(email)
  const at = normalized.lastIndexOf('@')
  if (at < 1 || at === normalized.length - 1) return false

  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)

  if (!local || local.includes(' ')) return false
  if (domain !== ALLOWED_EMAIL_DOMAIN) return false

  // Basic local-part sanity (no consecutive dots / leading-trailing dots)
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false
  }

  return true
}
