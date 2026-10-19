import { describe, expect, it } from 'vitest'

import { isAllowedCorporateEmail, normalizeEmail } from './access'

describe('isAllowedCorporateEmail', () => {
  it('accepts exact @221e.space addresses', () => {
    expect(isAllowedCorporateEmail('user@221e.space')).toBe(true)
    expect(isAllowedCorporateEmail('  Name.Sur@221E.SPACE  ')).toBe(true)
  })

  it('rejects other domains', () => {
    expect(isAllowedCorporateEmail('user@gmail.com')).toBe(false)
    expect(isAllowedCorporateEmail('user@221e.com')).toBe(false)
    expect(isAllowedCorporateEmail('user@mail.221e.space')).toBe(false)
    expect(isAllowedCorporateEmail('user@evil221e.space')).toBe(false)
    expect(isAllowedCorporateEmail('user@221e.space.evil.com')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isAllowedCorporateEmail('')).toBe(false)
    expect(isAllowedCorporateEmail('@221e.space')).toBe(false)
    expect(isAllowedCorporateEmail('user@')).toBe(false)
    expect(isAllowedCorporateEmail('not-an-email')).toBe(false)
  })
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  A@221E.SPACE ')).toBe('a@221e.space')
  })
})
