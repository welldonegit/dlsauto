import { describe, expect, it } from 'vitest'

import { alternatives, boughtTogether, fromSameCar, type RecoProduct } from './recommend'

// Type ids: Фара 10, Двері 20, Турбіна 30, Двигун 31, ПНВТ 32, Помпа 40 (broad),
// Важіль верхній 50, Важіль нижній 51, Кардан 60, Диски 70, Генератор 80.
// Model ids: ranger 1, pajero 2, l200 3.
function p(o: Partial<RecoProduct> & { id: number; partTypeId: number }): RecoProduct {
  return {
    broad: false,
    position: null,
    modelId: 1,
    alsoFitsIds: [],
    donorId: null,
    categoryId: 100,
    oem: [],
    cross: [],
    conditionLabel: 'used',
    price: 1000,
    wheelKey: null,
    ...o,
  }
}

const pool: RecoProduct[] = [
  p({ id: 1, partTypeId: 10, position: 'front-left', oem: ['FL1'], price: 2000 }), // фара ліва
  p({ id: 2, partTypeId: 10, position: 'front-right', oem: ['FR1'], price: 2000 }), // фара права
  p({
    id: 3,
    partTypeId: 10,
    position: 'front-left',
    oem: ['FL1'],
    conditionLabel: 'used_checked',
    price: 2500,
  }), // інша фара ліва, той самий OEM
  p({ id: 4, partTypeId: 20, position: 'front-left', oem: ['FL1'], price: 3000, categoryId: 300 }), // двері, ТОЙ САМИЙ код — кросс-тип (Р44)
  p({ id: 5, partTypeId: 30, position: 'none', oem: ['T1'], donorId: 1, price: 8000 }), // турбіна
  p({
    id: 6,
    partTypeId: 31,
    position: 'none',
    oem: ['E1'],
    donorId: 1,
    conditionLabel: 'used_checked',
    price: 72000,
  }), // двигун
  p({ id: 7, partTypeId: 32, position: 'none', oem: ['P1'], donorId: 1, price: 7000 }), // ПНВТ
  p({
    id: 8,
    partTypeId: 40,
    broad: true,
    position: 'none',
    modelId: 2,
    oem: ['ME1'],
    price: 2200,
  }), // помпа Pajero (broad)
  p({
    id: 9,
    partTypeId: 40,
    broad: true,
    position: 'none',
    modelId: 3,
    oem: ['ME1'],
    price: 2100,
  }), // помпа L200, той самий OEM
  p({ id: 10, partTypeId: 50, position: 'front-left', oem: ['AV1'] }), // важіль верх лів
  p({ id: 11, partTypeId: 50, position: 'front-right', oem: ['AV2'] }), // важіль верх прав
  p({ id: 12, partTypeId: 51, position: 'front-left', oem: ['AN1'] }), // важіль НИЖ лів (інший тип)
  p({ id: 13, partTypeId: 60, position: 'front', oem: ['K1'] }), // кардан передній
  p({ id: 14, partTypeId: 60, position: 'rear', oem: ['K2'] }), // кардан задній
  p({
    id: 15,
    partTypeId: 70,
    position: 'none',
    modelId: null,
    wheelKey: 'R16|6x139.7',
    price: 11000,
  }), // диски R16
  p({
    id: 16,
    partTypeId: 70,
    position: 'none',
    modelId: null,
    wheelKey: 'R16|6x139.7',
    price: 10000,
  }), // диски R16 інші
  p({
    id: 17,
    partTypeId: 70,
    position: 'none',
    modelId: null,
    wheelKey: 'R17|6x139.7',
    price: 14000,
  }), // диски R17
  p({ id: 18, partTypeId: 80, position: 'none', oem: ['G1'], donorId: 1 }), // генератор того ж донора
]

describe('alternatives', () => {
  it('OEM-match stays within the same type — cross-type door is excluded (Р44)', () => {
    const ids = alternatives(
      p({ id: 1, partTypeId: 10, position: 'front-left', oem: ['FL1'] }),
      pool,
    ).map((x) => x.id)
    expect(ids).toContain(3) // same type фара, same OEM, same side
    expect(ids).not.toContain(4) // двері with the same code — different type
    expect(ids).not.toContain(2) // фара права — wrong side
  })
  it('cross number counts as OEM within the same type, across models (Р52)', () => {
    // Two generators on different models: they share no OEM and no model, so they
    // only become alternatives because A lists B's number as a cross number.
    const genA = p({
      id: 180,
      partTypeId: 80,
      position: 'none',
      modelId: 1,
      oem: ['G1'],
      cross: ['G2'],
    })
    const genB = p({ id: 181, partTypeId: 80, position: 'none', modelId: 2, oem: ['G2'] })
    const genC = p({ id: 182, partTypeId: 80, position: 'none', modelId: 3, oem: ['G9'] })
    const set = [genA, genB, genC]
    expect(alternatives(genA, set).map((x) => x.id)).toEqual([181]) // A.cross ↔ B.oem
    expect(alternatives(genB, set).map((x) => x.id)).toEqual([180]) // symmetric: B.oem ↔ A.cross
    expect(alternatives(genC, set).map((x) => x.id)).toEqual([]) // G9 matches nothing
  })
  it('broad types take alternatives by OEM only, across models (Р35)', () => {
    const ids = alternatives(
      pool.find((x) => x.id === 8)!,
      pool,
    ).map((x) => x.id)
    expect(ids).toEqual([9]) // same OEM ME1, different model — ok because broad→OEM
  })
  it('upper arm has no alternative from the lower arm or the opposite side', () => {
    expect(
      alternatives(
        pool.find((x) => x.id === 10)!,
        pool,
      ).map((x) => x.id),
    ).toEqual([])
  })
  it('front propshaft is not an alternative to the rear one (axis, Р46)', () => {
    expect(
      alternatives(
        pool.find((x) => x.id === 13)!,
        pool,
      ).map((x) => x.id),
    ).toEqual([])
  })
  it('wheels match by size, not model (Р49)', () => {
    expect(
      alternatives(
        pool.find((x) => x.id === 15)!,
        pool,
      ).map((x) => x.id),
    ).toEqual([16])
  })
  it('sorts checked first then by price', () => {
    const extra = [
      ...pool,
      p({ id: 99, partTypeId: 10, position: 'front-left', oem: ['FL1'], price: 1000 }),
    ]
    const ids = alternatives(
      pool.find((x) => x.id === 1)!,
      extra,
    ).map((x) => x.id)
    expect(ids[0]).toBe(3) // used_checked wins over the cheaper used one
  })
})

describe('boughtTogether', () => {
  it('opposite side: фара ліва → фара права (Р37)', () => {
    const ids = boughtTogether(
      pool.find((x) => x.id === 1)!,
      pool,
      [{ typeId: 10, side: 'opposite' }],
    ).map((x) => x.id)
    expect(ids).toEqual([2])
  })
  it('engine → turbine + pnvt, donor parts first (any side)', () => {
    const ids = boughtTogether(
      pool.find((x) => x.id === 6)!,
      pool,
      [
        { typeId: 30, side: 'any' },
        { typeId: 32, side: 'any' },
      ],
    ).map((x) => x.id)
    expect(ids).toContain(5)
    expect(ids).toContain(7)
    expect(ids.length).toBeLessThanOrEqual(3)
  })
})

describe('fromSameCar', () => {
  it('returns same-donor parts when the donor has ≥3 in stock (Р50)', () => {
    const res = fromSameCar(
      pool.find((x) => x.id === 6)!,
      pool,
    )
    expect(res.every((x) => x.donorId === 1)).toBe(true)
    expect(res.map((x) => x.id)).not.toContain(6)
    expect(res.length).toBeGreaterThanOrEqual(3)
  })
  it('falls back to the same model, current category first, when no donor', () => {
    const target = p({ id: 50, partTypeId: 10, donorId: null, categoryId: 100 })
    const res = fromSameCar(target, pool)
    expect(res.length).toBeGreaterThan(0)
    // first results share the target category
    expect(res[0].categoryId).toBe(100)
  })
})
