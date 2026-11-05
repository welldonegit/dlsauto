import { describe, expect, it } from 'vitest'

import { modelDisplayName, modelLabel, modelYears } from './modelName'

describe('modelDisplayName', () => {
  it('name only', () => {
    expect(modelDisplayName({ name: 'Terracan' })).toBe('Terracan')
  })
  it('name + generation', () => {
    expect(modelDisplayName({ name: 'Ranger', generation: 'T6' })).toBe('Ranger T6')
  })
  it('name + twin + generation', () => {
    expect(modelDisplayName({ name: 'Navara', twinName: 'Pathfinder', generation: 'R51' })).toBe(
      'Navara / Pathfinder R51',
    )
  })
})

describe('modelYears', () => {
  it('full span', () => {
    expect(modelYears({ name: 'L200', yearFrom: 2005, yearTo: 2015 })).toBe('2005–2015')
  })
  it('open-ended (still made)', () => {
    expect(modelYears({ name: 'L200', yearFrom: 2015 })).toBe('2015–')
  })
  it('no years', () => {
    expect(modelYears({ name: 'Pajero Wagon' })).toBe('')
  })
})

describe('modelLabel', () => {
  it('combines name and years', () => {
    expect(modelLabel({ name: 'L200', yearFrom: 2005, yearTo: 2015 })).toBe('L200 2005–2015')
  })
  it('drops the space when there are no years', () => {
    expect(modelLabel({ name: 'Pajero Wagon' })).toBe('Pajero Wagon')
  })
})
