import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  isFirebaseConfigured: vi.fn(() => false),
}))

import { isFirebaseConfigured } from '@/lib/env'

import { submitFeedback } from './submitFeedback'

describe('submitFeedback', () => {
  beforeEach(() => {
    vi.mocked(isFirebaseConfigured).mockReturnValue(false)
  })

  it('throws not_configured when Firebase env is missing', async () => {
    await expect(
      submitFeedback({
        type: 'anonymous',
        topicId: 'ideas',
        message: 'This is a sufficiently long anonymous message.',
        recipientId: 'hrd',
        language: 'uk',
        accessEmail: 'user@221e.space',
        allowPublicReply: false,
      }),
    ).rejects.toMatchObject({
      name: 'SubmitFeedbackError',
      code: 'not_configured',
    })
  })
})
