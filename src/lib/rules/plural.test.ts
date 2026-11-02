import { describe, expect, it } from 'vitest'

import { partsLabel, partsWord } from './plural'

describe('partsWord (Ukrainian plural)', () => {
  it('one form', () => {
    expect(partsWord(1)).toBe('деталь')
    expect(partsWord(21)).toBe('деталь')
  })
  it('few form', () => {
    expect(partsWord(2)).toBe('деталі')
    expect(partsWord(4)).toBe('деталі')
    expect(partsWord(33)).toBe('деталі')
  })
  it('many form', () => {
    expect(partsWord(5)).toBe('деталей')
    expect(partsWord(11)).toBe('деталей') // 11..14 are always "many"
    expect(partsWord(12)).toBe('деталей')
    expect(partsWord(0)).toBe('деталей')
  })
  it('formats count + word', () => {
    expect(partsLabel(85)).toBe('85 деталей')
    expect(partsLabel(1)).toBe('1 деталь')
  })
})
