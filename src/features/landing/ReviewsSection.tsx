import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Reveal } from '@/features/landing/Reveal'
import { formatFeedbackDate } from '@/lib/api/adminFeedback'
import { listPublicReviews, type AdminReplyDoc } from '@/lib/api/adminReplies'

export function ReviewsSection() {
  const { t } = useTranslation()
  const [items, setItems] = useState<AdminReplyDoc[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await listPublicReviews()
        if (!cancelled) {
          setItems(data)
          setFailed(false)
        }
      } catch {
        if (!cancelled) {
          setItems([])
          setFailed(true)
        }
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <section
      id="reviews"
      className="border-t border-[var(--color-border)]/60 bg-[var(--color-muted)]/25 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
            {t('landing.reviews.title')}
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
            {t('landing.reviews.subtitle')}
          </p>
        </Reveal>

        {failed && (
          <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">{t('landing.reviews.error')}</p>
        )}

        {!failed && items.length === 0 && (
          <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">{t('landing.reviews.empty')}</p>
        )}

        {items.length > 0 && (
          <ul className="mt-12 grid gap-8 md:grid-cols-2">
            {items.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.05}>
                <li className="space-y-3">
                  {item.topicId && (
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                      {t(`topics.${item.topicId}`, { defaultValue: item.topicId })}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{item.body}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {formatFeedbackDate(item.createdAt)}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
