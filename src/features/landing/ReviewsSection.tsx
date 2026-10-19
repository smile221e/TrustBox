import { ChevronUp, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Reveal } from '@/features/landing/Reveal'
import { useAuth } from '@/hooks/useAuth'
import {
  listMyUpvotedReplyIds,
  listPublicReviews,
  toggleReplyUpvote,
  type AdminReplyDoc,
} from '@/lib/api/adminReplies'
import type { AppLanguage, FeedbackStatus } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { cn } from '@/lib/utils'

function statusTone(status: FeedbackStatus | undefined) {
  switch (status) {
    case 'closed':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'in_progress':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
    default:
      return 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300'
  }
}

function AnswerCard({
  item,
  voted,
  onToggleVote,
}: {
  item: AdminReplyDoc
  voted: boolean
  onToggleVote: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const language = (
    ['uk', 'en', 'es'].includes(i18n.language) ? i18n.language : 'uk'
  ) as AppLanguage

  const status = item.feedbackStatus ?? 'in_progress'
  const author =
    item.authorKind === 'identified' && item.authorName
      ? item.authorName
      : t('admin.anonymous')
  const question = item.questionText?.trim() || item.body
  const hasAnswer = Boolean(item.questionText?.trim()) && Boolean(item.body.trim())

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_1px_0_rgba(16,40,32,0.04)]">
      <div className="flex">
        <div
          className={cn(
            'flex w-14 shrink-0 flex-col items-center justify-start gap-1 border-r border-[var(--color-border)]/70 px-2 py-4',
            voted && 'bg-[var(--color-primary)]/10',
          )}
        >
          <button
            type="button"
            onClick={() => onToggleVote(item.id)}
            className={cn(
              'rounded-md p-1 transition-colors hover:bg-[var(--color-muted)]/60',
              voted ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]',
            )}
            aria-label={t('landing.reviews.upvote')}
            aria-pressed={voted}
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              voted ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]',
            )}
          >
            {item.upvoteCount ?? 0}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-3 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 font-medium',
                statusTone(status),
              )}
            >
              {t(`admin.status.${status}`)}
            </span>
            {item.topicId && (
              <>
                <span className="text-[var(--color-muted-foreground)]">·</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {t(`topics.${item.topicId}`, { defaultValue: item.topicId })}
                </span>
              </>
            )}
            <span className="ml-auto text-[var(--color-muted-foreground)]">{author}</span>
          </div>

          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-snug tracking-tight sm:text-xl">
            {question}
          </h3>

          {hasAnswer && (
            <div className="rounded-xl bg-[var(--color-muted)]/45 px-3.5 py-3 dark:bg-[var(--color-muted)]/35">
              <p className="text-xs font-medium text-[var(--color-primary)]">
                {item.adminDisplayName || t('landing.reviews.admin')}
                <span className="text-[var(--color-muted-foreground)]"> · Admin</span>
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
                {item.body}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-xs text-[var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {hasAnswer ? 1 : 0}
            </span>
            <span>{formatRelativeTime(item.createdAt, language)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ReviewsSection() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AdminReplyDoc[]>([])
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    void (async () => {
      if (!user) {
        if (!cancelled) {
          setItems([])
          setVotedIds(new Set())
          setFailed(false)
          setLoaded(true)
        }
        return
      }

      try {
        const data = await listPublicReviews()
        if (cancelled) return
        setItems(data)
        setFailed(false)
        const voted = await listMyUpvotedReplyIds(data.map((d) => d.id))
        if (!cancelled) setVotedIds(voted)
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
  }, [authLoading, user])

  const onToggleVote = async (id: string) => {
    try {
      const result = await toggleReplyUpvote(id)
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, upvoteCount: result.upvoteCount } : item)),
      )
      setVotedIds((prev) => {
        const next = new Set(prev)
        if (result.voted) next.add(id)
        else next.delete(id)
        return next
      })
    } catch {
      // ignore — vote is best-effort
    }
  }

  if (!loaded) {
    return null
  }

  return (
    <section
      id="reviews"
      className="border-t border-[var(--color-border)]/60 bg-[var(--color-muted)]/20 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
            {t('landing.reviews.title')}
          </h2>
        </Reveal>

        {failed && (
          <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">{t('landing.reviews.error')}</p>
        )}

        {!failed && items.length === 0 && (
          <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">{t('landing.reviews.empty')}</p>
        )}

        {items.length > 0 && (
          <ul className="mt-10 space-y-4">
            {items.map((item, index) => (
              <Reveal key={item.id} delay={Math.min(index, 6) * 0.04}>
                <li>
                  <AnswerCard
                    item={item}
                    voted={votedIds.has(item.id)}
                    onToggleVote={(id) => void onToggleVote(id)}
                  />
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
