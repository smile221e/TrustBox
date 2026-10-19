import { Heart, MessageCircle, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Reveal } from '@/features/landing/Reveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAccess } from '@/hooks/useAccess'
import { useAuth } from '@/hooks/useAuth'
import {
  addComment,
  listComments,
  listMyHeartedIds,
  listPublicThreads,
  toggleFeedbackHeart,
  type PublicComment,
  type PublicThread,
} from '@/lib/api/publicWall'
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

function CommentModal({
  thread,
  open,
  onClose,
  onSubmitted,
}: {
  thread: PublicThread
  open: boolean
  onClose: () => void
  onSubmitted: (comment: PublicComment, nextCount: number) => void
}) {
  const { t } = useTranslation()
  const { email: accessEmail } = useAccess()
  const formId = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [comments, setComments] = useState<PublicComment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayEmail = email || accessEmail || ''

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const list = await listComments(thread.id)
        if (!cancelled) {
          setComments(list)
          setError(null)
          if (accessEmail) setEmail(accessEmail)
        }
      } catch {
        if (!cancelled) setComments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, thread.id, accessEmail])

  if (!open) return null

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const comment = await addComment({
        feedbackId: thread.id,
        name,
        email: displayEmail,
        body,
      })
      setComments((prev) => [...prev, comment])
      setBody('')
      onSubmitted(comment, thread.commentCount + 1)
    } catch {
      setError(t('landing.reviews.commentError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="min-w-0">
            <h3 id={`${formId}-title`} className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {t('landing.reviews.threadTitle')}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
              {thread.question}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/50"
            aria-label={t('common.backHome')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {thread.answer && (
            <div className="rounded-xl bg-[var(--color-muted)]/40 px-3 py-2.5">
              <p className="text-xs font-medium text-[var(--color-primary)]">
                {thread.answer.adminDisplayName} · Admin
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{thread.answer.body}</p>
            </div>
          )}

          {loading && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t('common.loading')}</p>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t('landing.reviews.noComments')}</p>
          )}

          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-semibold text-[var(--color-primary)]"
                  aria-hidden
                >
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-[var(--color-muted)]/35 px-3 py-2">
                  <p className="text-xs font-medium">
                    {c.name}
                    <span className="ml-2 font-normal text-[var(--color-muted-foreground)]">{c.email}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 border-t border-[var(--color-border)] px-4 py-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`${formId}-name`}>{t('form.name.label')}</Label>
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${formId}-email`}>{t('form.email.label')}</Label>
              <Input
                id={`${formId}-email`}
                type="email"
                value={displayEmail}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${formId}-body`}>{t('landing.reviews.commentLabel')}</Label>
            <Textarea
              id={`${formId}-body`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={2}
              maxLength={2000}
              rows={3}
              placeholder={t('landing.reviews.commentPlaceholder')}
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving || body.trim().length < 2 || !name.trim()}>
            {saving ? t('common.loading') : t('landing.reviews.commentSend')}
          </Button>
        </form>
      </div>
    </div>
  )
}

function AnswerCard({
  thread,
  hearted,
  onToggleHeart,
  onOpenComments,
}: {
  thread: PublicThread
  hearted: boolean
  onToggleHeart: (id: string) => void
  onOpenComments: (thread: PublicThread) => void
}) {
  const { t, i18n } = useTranslation()
  const language = (
    ['uk', 'en', 'es'].includes(i18n.language) ? i18n.language : 'uk'
  ) as AppLanguage

  const author =
    thread.authorKind === 'identified' && thread.authorName
      ? thread.authorName
      : t('admin.anonymous')

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_1px_0_rgba(16,40,32,0.04)]">
      <div className="flex">
        <div
          className={cn(
            'flex w-14 shrink-0 flex-col items-center justify-start gap-1 border-r border-[var(--color-border)]/70 px-2 py-4',
            hearted && 'bg-rose-500/10',
          )}
        >
          <button
            type="button"
            onClick={() => onToggleHeart(thread.id)}
            className={cn(
              'rounded-md p-1 transition-colors hover:bg-[var(--color-muted)]/60',
              hearted ? 'text-rose-500' : 'text-[var(--color-muted-foreground)]',
            )}
            aria-label={t('landing.reviews.heart')}
            aria-pressed={hearted}
          >
            <Heart className={cn('h-5 w-5', hearted && 'fill-current')} strokeWidth={2} />
          </button>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              hearted ? 'text-rose-500' : 'text-[var(--color-foreground)]',
            )}
          >
            {thread.heartCount}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-3 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 font-medium',
                statusTone(thread.status),
              )}
            >
              {t(`admin.status.${thread.status}`)}
            </span>
            {thread.topicId && (
              <>
                <span className="text-[var(--color-muted-foreground)]">·</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {t(`topics.${thread.topicId}`, { defaultValue: thread.topicId })}
                </span>
              </>
            )}
            <span className="ml-auto text-[var(--color-muted-foreground)]">{author}</span>
          </div>

          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-snug tracking-tight sm:text-xl">
            {thread.question}
          </h3>

          {thread.answer && (
            <div className="rounded-xl bg-[var(--color-muted)]/45 px-3.5 py-3 dark:bg-[var(--color-muted)]/35">
              <p className="text-xs font-medium text-[var(--color-primary)]">
                {thread.answer.adminDisplayName || t('landing.reviews.admin')}
                <span className="text-[var(--color-muted-foreground)]"> · Admin</span>
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
                {thread.answer.body}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-xs text-[var(--color-muted-foreground)]">
            <button
              type="button"
              onClick={() => onOpenComments(thread)}
              className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-[var(--color-muted)]/50 hover:text-[var(--color-foreground)]"
              aria-label={t('landing.reviews.openComments')}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {thread.commentCount}
            </button>
            <span>{formatRelativeTime(thread.createdAt, language)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ReviewsSection() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<PublicThread[]>([])
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [activeThread, setActiveThread] = useState<PublicThread | null>(null)

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    void (async () => {
      if (!user) {
        if (!cancelled) {
          setItems([])
          setHeartedIds(new Set())
          setFailed(false)
          setLoaded(true)
        }
        return
      }

      try {
        const data = await listPublicThreads()
        if (cancelled) return
        setItems(data)
        setFailed(false)
        try {
          const hearted = await listMyHeartedIds(data.map((d) => d.id))
          if (!cancelled) setHeartedIds(hearted)
        } catch {
          if (!cancelled) setHeartedIds(new Set())
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
  }, [authLoading, user])

  const onToggleHeart = async (id: string) => {
    try {
      const result = await toggleFeedbackHeart(id)
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, heartCount: result.heartCount } : item)),
      )
      setHeartedIds((prev) => {
        const next = new Set(prev)
        if (result.hearted) next.add(id)
        else next.delete(id)
        return next
      })
    } catch {
      // ignore
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
                    thread={item}
                    hearted={heartedIds.has(item.id)}
                    onToggleHeart={(id) => void onToggleHeart(id)}
                    onOpenComments={setActiveThread}
                  />
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </div>

      {activeThread && (
        <CommentModal
          thread={activeThread}
          open
          onClose={() => setActiveThread(null)}
          onSubmitted={(_comment, nextCount) => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === activeThread.id ? { ...item, commentCount: nextCount } : item,
              ),
            )
            setActiveThread((prev) => (prev ? { ...prev, commentCount: nextCount } : prev))
          }}
        />
      )}
    </section>
  )
}
