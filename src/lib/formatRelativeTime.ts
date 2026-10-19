import type { AppLanguage } from '@/lib/constants'

/** Compact relative time for the public answers list. */
export function formatRelativeTime(value: unknown, language: AppLanguage = 'uk'): string {
  let date: Date | null = null
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate()
  } else if (value instanceof Date) {
    date = value
  }
  if (!date || Number.isNaN(date.getTime())) return '—'

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(language === 'uk' ? 'uk' : language, { numeric: 'auto' })

  if (seconds < 60) return rtf.format(-Math.max(seconds, 1), 'second')
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 48) return rtf.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 14) return rtf.format(-days, 'day')
  const weeks = Math.round(days / 7)
  if (weeks < 8) return rtf.format(-weeks, 'week')
  const months = Math.round(days / 30)
  return rtf.format(-months, 'month')
}
