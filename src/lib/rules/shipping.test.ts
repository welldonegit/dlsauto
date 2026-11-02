import { describe, expect, it } from 'vitest'

import { dispatchDay, dispatchLabel } from './shipping'

// Europe/Kyiv is UTC+2 in January (no DST). 2026-01-05 Mon, 01-10 Sat, 01-11 Sun.
describe('dispatchDay (cutoff 15:00 Europe/Kyiv, Mon–Sat)', () => {
  it('before cutoff on a workday → today', () => {
    expect(dispatchDay(new Date('2026-01-05T12:00:00Z'))).toBe('today') // 14:00 Mon
  })
  it('after cutoff on a weekday → tomorrow', () => {
    expect(dispatchDay(new Date('2026-01-05T14:00:00Z'))).toBe('tomorrow') // 16:00 Mon
  })
  it('after cutoff on Saturday → monday', () => {
    expect(dispatchDay(new Date('2026-01-10T14:00:00Z'))).toBe('monday') // 16:00 Sat
  })
  it('any time Sunday → monday', () => {
    expect(dispatchDay(new Date('2026-01-11T09:00:00Z'))).toBe('monday') // 11:00 Sun
  })
  it('labels in Ukrainian', () => {
    expect(dispatchLabel(new Date('2026-01-05T12:00:00Z'))).toBe('Сьогодні')
    expect(dispatchLabel(new Date('2026-01-11T09:00:00Z'))).toBe('У понеділок')
  })
})
