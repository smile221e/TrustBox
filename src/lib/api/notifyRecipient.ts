import type { FeedbackSubmissionInput } from '@/types/feedback'

export type NotifyPayload = {
  to: string
  recipientName: string
  feedback: FeedbackSubmissionInput
  topicLabel: string
  feedbackId: string
}

/**
 * Sends a notification email to the chosen recipient.
 *
 * Spark-friendly options (configure one in `.env`):
 * 1. `VITE_NOTIFY_WEBHOOK_URL` — POST JSON (Make.com / Apps Script / n8n)
 * 2. EmailJS — `VITE_EMAILJS_SERVICE_ID` + `TEMPLATE_ID` + `PUBLIC_KEY`
 *
 * Soft-fails: submit success is never blocked by notify errors.
 */
export async function notifyRecipientOfFeedback(payload: NotifyPayload): Promise<void> {
  if (!payload.to.trim()) return

  const lines = [
    `TrustBox — нове звернення`,
    ``,
    `Адресат: ${payload.recipientName}`,
    `Тема: ${payload.topicLabel}`,
    `Тип: ${payload.feedback.type}`,
    `Мова: ${payload.feedback.language}`,
    `ID: ${payload.feedbackId}`,
    ``,
  ]

  if (payload.feedback.type === 'identified') {
    lines.push(`Імʼя: ${payload.feedback.name ?? '—'}`)
    if (payload.feedback.nickname) lines.push(`Нікнейм: ${payload.feedback.nickname}`)
    lines.push(`Email автора: ${payload.feedback.email ?? '—'}`)
    lines.push(``)
  } else {
    lines.push(`Автор: анонімно`)
    lines.push(``)
  }

  lines.push(`Повідомлення:`)
  lines.push(payload.feedback.message)

  const text = lines.join('\n')
  const subject = `[TrustBox] ${payload.topicLabel} → ${payload.recipientName}`

  const webhook = import.meta.env.VITE_NOTIFY_WEBHOOK_URL?.trim()
  if (webhook) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        text,
        html: text.replace(/\n/g, '<br/>'),
        ...payload,
      }),
    })
    return
  }

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim()
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim()
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim()

  if (serviceId && templateId && publicKey) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: payload.to,
          subject,
          message: text,
          recipient_name: payload.recipientName,
          topic: payload.topicLabel,
          feedback_type: payload.feedback.type,
          author_name: payload.feedback.name ?? '',
          author_email: payload.feedback.email ?? '',
          feedback_id: payload.feedbackId,
        },
      }),
    })
    if (!res.ok) {
      throw new Error(`emailjs_${res.status}`)
    }
  }
}
