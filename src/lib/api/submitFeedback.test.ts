import { describe, expect, it } from 'vitest'

import { isFirebaseConfigured } from '@/lib/env'

import { SubmitFeedbackError, submitFeedback } from './submitFeedback'

describe('submitFeedback', () => {
  it('throws not_configured when Firebase env is missing', async () => {
    expect(isFirebaseConfigured()).toBe(false)

    await expect(
      submitFeedback({
        type: 'anonymous',
        topicId: 'ideas',
        message: 'This is a sufficiently long anonymous message.',
        recipientId: 'hrd',
        language: 'uk',
        accessEmail: 'user@221e.space',
      }),
    ).rejects.toMatchObject({
      name: 'SubmitFeedbackError',
      code: 'not_configured',
    } satisfies Partial<SubmitFeedbackError>)
  })
})
