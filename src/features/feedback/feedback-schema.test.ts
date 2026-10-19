import { describe, expect, it } from 'vitest'

import {
  INITIAL_FEEDBACK_VALUES,
  toSubmissionInput,
  validateStepOne,
  validateStepTwo,
} from './feedback-schema'

describe('feedback-schema', () => {
  it('requires topic on step one', () => {
    const errors = validateStepOne(INITIAL_FEEDBACK_VALUES)
    expect(errors.topicId).toBe('form.errors.topic')
  })

  it('accepts a complete step one', () => {
    const errors = validateStepOne({
      ...INITIAL_FEEDBACK_VALUES,
      topicId: 'ideas',
      recipientId: 'hrd',
    })
    expect(errors).toEqual({})
  })

  it('requires a longer message on step two', () => {
    const errors = validateStepTwo({
      ...INITIAL_FEEDBACK_VALUES,
      message: 'too short',
    })
    expect(errors.message).toBe('form.errors.messageShort')
  })

  it('requires contact fields for identified feedback', () => {
    const errors = validateStepTwo({
      ...INITIAL_FEEDBACK_VALUES,
      type: 'identified',
      message: 'This is a sufficiently long message for validation.',
    })
    expect(errors.name).toBe('form.errors.name')
    expect(errors.email).toBe('form.errors.emailRequired')
  })

  it('builds an anonymous submission payload', () => {
    const payload = toSubmissionInput(
      {
        ...INITIAL_FEEDBACK_VALUES,
        topicId: 'thanks',
        recipientId: 'ceo',
        message: 'Thank you for the transparent communication this quarter.',
      },
      'uk',
      'user@221e.space',
    )
    expect(payload).toMatchObject({
      type: 'anonymous',
      topicId: 'thanks',
      recipientId: 'ceo',
      language: 'uk',
      accessEmail: 'user@221e.space',
      allowPublicReply: false,
    })
    expect(payload?.name).toBeUndefined()
  })
})
