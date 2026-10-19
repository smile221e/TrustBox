import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAccess } from '@/hooks/useAccess'
import {
  SubmitFeedbackError,
  submitFeedback,
} from '@/lib/api/submitFeedback'
import {
  DEFAULT_RECIPIENT_IDS,
  TOPIC_IDS,
  type AppLanguage,
  type FeedbackType,
  type TopicId,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

import {
  INITIAL_FEEDBACK_VALUES,
  MAX_MESSAGE,
  MIN_MESSAGE,
  toSubmissionInput,
  validateStepOne,
  validateStepTwo,
  type FeedbackFieldErrors,
  type FeedbackFormValues,
} from './feedback-schema'

type Step = 1 | 2

const selectClassName =
  'flex h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50'

export function FeedbackForm() {
  const { t, i18n } = useTranslation()
  const { email: accessEmail } = useAccess()
  const formId = useId()
  const [step, setStep] = useState<Step>(1)
  const [values, setValues] = useState<FeedbackFormValues>(INITIAL_FEEDBACK_VALUES)
  const [errors, setErrors] = useState<FeedbackFieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const setField = <K extends keyof FeedbackFormValues>(key: K, value: FeedbackFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const fieldError = (key: keyof FeedbackFieldErrors) => {
    const code = errors[key]
    return code ? t(code) : undefined
  }

  const goNext = () => {
    const nextErrors = validateStepOne(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setStep(2)
    }
  }

  const goBack = () => {
    setErrors({})
    setStep(1)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)

    // Honeypot triggered — pretend success, write nothing on client
    if (values.website.trim()) {
      setSubmitted(true)
      return
    }

    const stepOneErrors = validateStepOne(values)
    const stepTwoErrors = validateStepTwo(values)
    const merged = { ...stepOneErrors, ...stepTwoErrors }
    setErrors(merged)

    if (Object.keys(stepOneErrors).length > 0) {
      setStep(1)
      return
    }
    if (Object.keys(stepTwoErrors).length > 0) {
      return
    }

    const language = (
      ['uk', 'en', 'es'].includes(i18n.language) ? i18n.language : 'uk'
    ) as AppLanguage

    if (!accessEmail) {
      setSubmitError(t('access.errors.domain'))
      return
    }

    const payload = toSubmissionInput(values, language, accessEmail)
    if (!payload) return

    setSubmitting(true)
    try {
      await submitFeedback(payload)
      setSubmitted(true)
    } catch (err) {
      if (err instanceof SubmitFeedbackError) {
        setSubmitError(t(`form.errors.submit.${err.code}`))
      } else {
        setSubmitError(t('form.errors.submit.unknown'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setValues(INITIAL_FEEDBACK_VALUES)
    setErrors({})
    setStep(1)
    setSubmitted(false)
    setSubmitError(null)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-8"
        role="status"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-accent)]"
            aria-hidden
          />
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {t('form.success.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
              {t('form.success.body')}
            </p>
            <Button type="button" variant="secondary" className="mt-6" onClick={resetForm}>
              {t('form.success.another')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_1px_0_rgba(15,60,55,0.04)] md:p-8"
      noValidate
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {t('form.step', { current: step, total: 2 })}
        </p>
        <ol className="flex gap-2" aria-hidden>
          {[1, 2].map((n) => (
            <li
              key={n}
              className={cn(
                'h-1.5 w-8 rounded-full transition-colors',
                n <= step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]',
              )}
            />
          ))}
        </ol>
      </div>

      {/* Honeypot — visually hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <Label htmlFor={`${formId}-website`}>{t('form.honeypot')}</Label>
        <Input
          id={`${formId}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setField('website', e.target.value)}
        />
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-medium">{t('form.type.label')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['anonymous', 'identified'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 transition-colors',
                    values.type === type
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]/40',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      name="feedback-type"
                      className="accent-[var(--color-primary)]"
                      checked={values.type === type}
                      onChange={() => setField('type', type as FeedbackType)}
                    />
                    {t(`form.type.${type}`)}
                  </span>
                  <span className="pl-6 text-xs text-[var(--color-muted-foreground)]">
                    {t(`form.type.${type}Hint`)}
                  </span>
                </label>
              ))}
            </div>
            {fieldError('type') && (
              <p className="mt-2 text-sm text-[var(--color-danger)]" role="alert">
                {fieldError('type')}
              </p>
            )}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-topic`}>{t('form.topic.label')}</Label>
            <select
              id={`${formId}-topic`}
              className={selectClassName}
              value={values.topicId}
              onChange={(e) => setField('topicId', e.target.value as TopicId | '')}
              aria-invalid={Boolean(errors.topicId)}
            >
              <option value="">{t('form.topic.placeholder')}</option>
              {TOPIC_IDS.map((topic) => (
                <option key={topic} value={topic}>
                  {t(`topics.${topic}`)}
                </option>
              ))}
            </select>
            {fieldError('topicId') && (
              <p className="text-sm text-[var(--color-danger)]" role="alert">
                {fieldError('topicId')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-recipient`}>{t('form.recipient.label')}</Label>
            <select
              id={`${formId}-recipient`}
              className={selectClassName}
              value={values.recipientId}
              onChange={(e) => setField('recipientId', e.target.value)}
              aria-invalid={Boolean(errors.recipientId)}
            >
              {DEFAULT_RECIPIENT_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`recipients.${id}`)}
                </option>
              ))}
            </select>
            {fieldError('recipientId') && (
              <p className="text-sm text-[var(--color-danger)]" role="alert">
                {fieldError('recipientId')}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" size="lg" onClick={goNext}>
              {t('form.next')}
              <ArrowRight />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {values.type === 'identified' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${formId}-name`}>{t('form.name.label')}</Label>
                <Input
                  id={`${formId}-name`}
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => setField('name', e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                {fieldError('name') && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {fieldError('name')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-nickname`}>
                  {t('form.nickname.label')}
                  <span className="ml-1 font-normal text-[var(--color-muted-foreground)]">
                    ({t('form.optional')})
                  </span>
                </Label>
                <Input
                  id={`${formId}-nickname`}
                  value={values.nickname}
                  onChange={(e) => setField('nickname', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-email`}>{t('form.email.label')}</Label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => setField('email', e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                {fieldError('email') && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {fieldError('email')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${formId}-message`}>{t('form.message.label')}</Label>
            <Textarea
              id={`${formId}-message`}
              value={values.message}
              onChange={(e) => setField('message', e.target.value)}
              placeholder={t('form.message.placeholder')}
              maxLength={MAX_MESSAGE}
              aria-invalid={Boolean(errors.message)}
            />
            <div className="flex items-start justify-between gap-3 text-xs text-[var(--color-muted-foreground)]">
              <span>
                {fieldError('message') ? (
                  <span className="text-[var(--color-danger)]" role="alert">
                    {fieldError('message')}
                  </span>
                ) : (
                  t('form.message.hint', { min: MIN_MESSAGE })
                )}
              </span>
              <span className="tabular-nums">
                {values.message.trim().length}/{MAX_MESSAGE}
              </span>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={goBack} disabled={submitting}>
              <ArrowLeft />
              {t('form.back')}
            </Button>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  {t('form.submitting')}
                </>
              ) : (
                t('form.submit')
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
