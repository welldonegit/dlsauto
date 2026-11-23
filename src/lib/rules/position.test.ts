import { describe, expect, it } from 'vitest'

import { decompose, oppositePosition, positionMatch } from './position'

describe('decompose', () => {
  it('splits a corner position onto axis + side', () => {
    expect(decompose('front-left')).toEqual({ axis: 'front', side: 'left', seat: 'any' })
    expect(decompose('rear-right')).toEqual({ axis: 'rear', side: 'right', seat: 'any' })
  })
  it('treats none as all-any', () => {
    expect(decompose('none')).toEqual({ axis: 'any', side: 'any', seat: 'any' })
    expect(decompose(null)).toEqual({ axis: 'any', side: 'any', seat: 'any' })
  })
})

describe('positionMatch (Р10/Р36 matrix)', () => {
  it('equal positions match', () => {
    expect(positionMatch('front-left', 'front-left')).toBe(true)
  })
  it('left and right do not match', () => {
    expect(positionMatch('left', 'right')).toBe(false)
    expect(positionMatch('front-left', 'front-right')).toBe(false)
  })
  it('axis must agree when both set', () => {
    expect(positionMatch('front-left', 'rear-left')).toBe(false)
    expect(positionMatch('front', 'rear')).toBe(false)
  })
  it('"—" (none/any) is compatible with everything', () => {
    expect(positionMatch('none', 'front-left')).toBe(true)
    expect(positionMatch('left', 'none')).toBe(true)
  })
  it('a bare side matches the same side with any axis', () => {
    expect(positionMatch('left', 'front-left')).toBe(true)
    expect(positionMatch('left', 'rear-left')).toBe(true)
  })
  it('both ("обидві сторони") is compatible with ліва and права (Р36)', () => {
    expect(positionMatch('both', 'left')).toBe(true)
    expect(positionMatch('both', 'right')).toBe(true)
    expect(positionMatch('both', 'front-left')).toBe(true)
    expect(positionMatch('both', 'both')).toBe(true)
  })
  it('pair (комплект) is an alternative only to pair (Р36)', () => {
    expect(positionMatch('pair', 'pair')).toBe(true)
    expect(positionMatch('pair', 'left')).toBe(false)
    expect(positionMatch('pair', 'both')).toBe(false)
  })
  it('seat matches only the equal seat', () => {
    expect(positionMatch('driver', 'driver')).toBe(true)
    expect(positionMatch('driver', 'passenger')).toBe(false)
    expect(positionMatch('driver', 'none')).toBe(true)
  })
})

describe('oppositePosition', () => {
  it('mirrors a side', () => {
    expect(oppositePosition('front-left')).toBe('front-right')
    expect(oppositePosition('left')).toBe('right')
    expect(oppositePosition('rear-right')).toBe('rear-left')
  })
  it('is null when there is no side', () => {
    expect(oppositePosition('front')).toBeNull()
    expect(oppositePosition('pair')).toBeNull()
    expect(oppositePosition('none')).toBeNull()
  })
})
