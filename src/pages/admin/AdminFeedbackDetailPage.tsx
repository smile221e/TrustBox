import { LoaderCircle, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AdminNav } from '@/features/admin/AdminNav'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  deleteFeedback,
  formatFeedbackDate,
  getFeedback,
  updateFeedbackStatus,
  type AdminFeedbackDoc,
} from '@/lib/api/adminFeedback'
import {
  createReply,
  listRepliesForFeedback,
  setReplyPublic,
  type AdminReplyDoc,
} from '@/lib/api/adminReplies'
import { listComments, type PublicComment } from '@/lib/api/publicWall'
import { FEEDBACK_STATUSES, type FeedbackStatus } from '@/lib/constants'

function DetailInner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [item, setItem] = useState<AdminFeedbackDoc | null>(null)
  const [replies, setReplies] = useState<AdminReplyDoc[]>([])
  const [comments, setComments] = useState<PublicComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [publishPublic, setPublishPublic] = useState(true)
  const [replyTargetCommentId, setReplyTargetCommentId] = useState<string | null>(null)
  const [commentReplyBody, setCommentReplyBody] = useState('')
  const [commentPublishPublic, setCommentPublishPublic] = useState(true)
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    const feedback = await getFeedback(id)
    setItem(feedback)
    if (feedback) {
      setPublishPublic(true)
      const [nextReplies, nextComments] = await Promise.all([
        listRepliesForFeedback(id),
        listComments(id).catch(() => [] as PublicComment[]),
      ])
      setReplies(nextReplies)
      setComments(nextComments)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        await reload()
      } catch {
        if (!cancelled) setError(t('admin.errors.load'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on id change only
  }, [id, t])

  const onStatus = async (status: FeedbackStatus) => {
    if (!item) return
    setSaving(true)
    try {
      await updateFeedbackStatus(item.id, status)
      setItem({ ...item, status })
    } catch {
      setError(t('admin.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!item) return
    if (!window.confirm(t('admin.deleteFeedbackConfirm'))) return
    setSaving(true)
    setError(null)
    try {
      await deleteFeedback(item.id)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : ''
      setError(detail ? `${t('admin.errors.save')} (${detail})` : t('admin.errors.save'))
      setSaving(false)
    }
  }

  const sendReply = async (body: string, isPublic: boolean, parentCommentId?: string | null) => {
    if (!item || body.trim().length < 2) return
    setSaving(true)
    setError(null)
    try {
      await createReply({
        feedbackId: item.id,
        body,
        isPublic,
        topicId: item.topicId,
        questionText: item.message,
        authorKind: item.type,
        authorName: item.name,
        feedbackStatus: item.status === 'new' ? 'in_progress' : item.status,
        parentCommentId: parentCommentId ?? '',
      })
      if (item.status === 'new') {
        await updateFeedbackStatus(item.id, 'in_progress')
      }
      await reload()
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : ''
      setError(detail ? `${t('admin.errors.save')} (${detail})` : t('admin.errors.save'))
      throw err
    } finally {
      setSaving(false)
    }
  }

  const onReply = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await sendReply(replyBody, publishPublic, null)
      setReplyBody('')
    } catch {
      // error already set
    }
  }

  const onCommentReply = async (event: FormEvent) => {
    event.preventDefault()
    if (!replyTargetCommentId) return
    try {
      await sendReply(commentReplyBody, commentPublishPublic, replyTargetCommentId)
      setCommentReplyBody('')
      setReplyTargetCommentId(null)
    } catch {
      // error already set
    }
  }

  const onTogglePublic = async (reply: AdminReplyDoc) => {
    if (!item) return
    setSaving(true)
    setError(null)
    try {
      await setReplyPublic({
        replyId: reply.id,
        isPublic: !reply.isPublic,
        questionText: item.message,
        authorKind: item.type,
        authorName: item.name,
        feedbackStatus: item.status,
      })
      await reload()
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : ''
      setError(detail ? `${t('admin.errors.save')} (${detail})` : t('admin.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  const topLevelReplies = replies.filter((r) => !r.parentCommentId)
  const repliesForComment = (commentId: string) =>
    replies.filter((r) => r.parentCommentId === commentId)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      </div>
    )
  }

  if (!item) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <p>{t('admin.errors.notFound')}</p>
        <Link to="/admin/dashboard" className="underline">
          {t('admin.dashboard')}
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <Link to="/admin/dashboard" className="underline">
              {t('admin.dashboard')}
            </Link>
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">
            {t(`topics.${item.topicId}`)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={saving}
            className="text-[var(--color-destructive)]"
            onClick={() => void onDelete()}
          >
            <Trash2 className="h-4 w-4" />
            {t('admin.deleteFeedback')}
          </Button>
          <AdminNav />
        </div>
      </div>

      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{t('admin.fields.status')}</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {FEEDBACK_STATUSES.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={item.status === s ? 'default' : 'secondary'}
                disabled={saving}
                onClick={() => void onStatus(s)}
              >
                {t(`admin.status.${s}`)}
              </Button>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{t('admin.fields.type')}</dt>
          <dd className="mt-1 font-medium">
            {item.type === 'anonymous' ? t('admin.anonymous') : t('admin.identified')}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{t('form.recipient.label')}</dt>
          <dd className="mt-1 font-medium">{item.recipientName}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{t('admin.fields.date')}</dt>
          <dd className="mt-1">{formatFeedbackDate(item.createdAt)}</dd>
        </div>
        {item.type === 'identified' && (
          <>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{t('form.name.label')}</dt>
              <dd className="mt-1">{item.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{t('form.email.label')}</dt>
              <dd className="mt-1">{item.email || '—'}</dd>
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <dt className="text-[var(--color-muted-foreground)]">{t('admin.fields.publicOptIn')}</dt>
          <dd className="mt-1">{item.allowPublicReply ? t('common.yes') : t('common.no')}</dd>
        </div>
      </dl>

      <div>
        <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {t('form.message.label')}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{item.message}</p>
      </div>

      <div className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          {t('admin.replies.title')}
        </h2>
        <ul className="space-y-3">
          {topLevelReplies.length === 0 && (
            <li className="text-sm text-[var(--color-muted-foreground)]">{t('admin.replies.empty')}</li>
          )}
          {topLevelReplies.map((r) => (
            <li key={r.id} className="space-y-2 border-l-2 border-[var(--color-primary)]/40 pl-4">
              <p className="whitespace-pre-wrap text-sm">{r.body}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <span>
                  {r.sentByEmail} · {formatFeedbackDate(r.createdAt)}
                  {r.isPublic ? ` · ${t('admin.replies.public')}` : ` · ${t('admin.replies.private')}`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void onTogglePublic(r)}
                >
                  {r.isPublic ? t('admin.replies.unpublish') : t('admin.replies.publish')}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={(e) => void onReply(e)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reply-body">{t('admin.replies.compose')}</Label>
            <Textarea
              id="reply-body"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={4}
              required
              minLength={2}
              maxLength={4000}
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={publishPublic}
              onChange={(e) => setPublishPublic(e.target.checked)}
            />
            <span>{t('admin.replies.publishHint')}</span>
          </label>
          {!item.allowPublicReply && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {t('admin.replies.noPublicOptIn')}
            </p>
          )}
          <Button type="submit" disabled={saving || replyBody.trim().length < 2}>
            {saving ? t('admin.replies.sending') : t('admin.replies.send')}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          {t('admin.comments.title')}
        </h2>
        <ul className="space-y-4">
          {comments.length === 0 && (
            <li className="text-sm text-[var(--color-muted-foreground)]">
              {t('admin.comments.empty')}
            </li>
          )}
          {comments.map((c) => {
            const nested = repliesForComment(c.id)
            return (
              <li
                key={c.id}
                className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
              >
                <div>
                  <p className="text-xs font-medium">
                    {c.name}
                    <span className="ml-2 font-normal text-[var(--color-muted-foreground)]">
                      {c.email}
                    </span>
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {formatFeedbackDate(c.createdAt)}
                  </p>
                </div>

                {nested.length > 0 && (
                  <ul className="space-y-2 border-l-2 border-[var(--color-primary)]/40 pl-4">
                    {nested.map((r) => (
                      <li key={r.id} className="space-y-2">
                        <p className="whitespace-pre-wrap text-sm">{r.body}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                          <span>
                            {r.sentByEmail} · {formatFeedbackDate(r.createdAt)}
                            {r.isPublic
                              ? ` · ${t('admin.replies.public')}`
                              : ` · ${t('admin.replies.private')}`}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={saving}
                            onClick={() => void onTogglePublic(r)}
                          >
                            {r.isPublic ? t('admin.replies.unpublish') : t('admin.replies.publish')}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {replyTargetCommentId === c.id ? (
                  <form onSubmit={(e) => void onCommentReply(e)} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`comment-reply-${c.id}`}>
                        {t('admin.comments.compose')}
                      </Label>
                      <Textarea
                        id={`comment-reply-${c.id}`}
                        value={commentReplyBody}
                        onChange={(e) => setCommentReplyBody(e.target.value)}
                        rows={3}
                        required
                        minLength={2}
                        maxLength={4000}
                        autoFocus
                      />
                    </div>
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={commentPublishPublic}
                        onChange={(e) => setCommentPublishPublic(e.target.checked)}
                      />
                      <span>{t('admin.replies.publishHint')}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saving || commentReplyBody.trim().length < 2}
                      >
                        {saving ? t('admin.replies.sending') : t('admin.comments.send')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={saving}
                        onClick={() => {
                          setReplyTargetCommentId(null)
                          setCommentReplyBody('')
                        }}
                      >
                        {t('admin.comments.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => {
                      setReplyTargetCommentId(c.id)
                      setCommentReplyBody('')
                      setCommentPublishPublic(true)
                    }}
                  >
                    {t('admin.comments.reply')}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function AdminFeedbackDetailPage() {
  return (
    <RequireAdmin>
      <DetailInner />
    </RequireAdmin>
  )
}
