import { describe, expect, it } from 'vitest'

import { pickupStatus } from './hours'

// January → Europe/Kyiv is EET (UTC+2), no DST, so these instants are stable.
// 2026-01-05 is Monday, 01-10 Saturday, 01-11 Sunday.
describe('pickupStatus (Europe/Kyiv, Mon–Sat 9–18)', () => {
  it('open during working hours', () => {
    const s = pickupStatus(new Date('2026-01-05T12:00:00Z')) // 14:00 Mon
    expect(s.open).toBe(true)
    expect(s.label).toContain('Зараз відкрито')
  })

  it('closed before opening → today', () => {
    const s = pickupStatus(new Date('2026-01-05T06:00:00Z')) // 08:00 Mon
    expect(s.open).toBe(false)
    expect(s.label).toContain('сьогодні')
  })

  it('closed after closing on a weekday → tomorrow', () => {
    const s = pickupStatus(new Date('2026-01-05T17:00:00Z')) // 19:00 Mon
    expect(s.open).toBe(false)
    expect(s.label).toContain('завтра')
  })

  it('closed on Saturday evening → Monday', () => {
    const s = pickupStatus(new Date('2026-01-10T17:00:00Z')) // 19:00 Sat
    expect(s.open).toBe(false)
    expect(s.label).toContain('понеділок')
  })

  it('closed all Sunday → Monday', () => {
    const s = pickupStatus(new Date('2026-01-11T12:00:00Z')) // 14:00 Sun
    expect(s.open).toBe(false)
    expect(s.label).toContain('понеділок')
  })
})
