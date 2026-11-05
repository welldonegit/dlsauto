/**
 * Display name for a model (PROJECT_CONTEXT §3). Composes the stored fields the
 * same way across the car picker, the models block and future catalog pages:
 * name, optional sister ("twin") model, optional generation, then the year
 * span. Years render as "2005–2015", or "2005–" when the model is still made.
 *
 *   modelDisplayName({ name: 'Navara', twinName: 'Pathfinder', generation: 'R51' })
 *     → "Navara / Pathfinder R51"
 *   modelLabel(same with yearFrom 2005, yearTo 2015) → "Navara / Pathfinder R51 2005–2015"
 */
type ModelNameFields = {
  name: string
  generation?: string | null
  twinName?: string | null
  yearFrom?: number | null
  yearTo?: number | null
}

export function modelDisplayName(m: ModelNameFields): string {
  const parts = [m.name]
  if (m.twinName) parts.push(`/ ${m.twinName}`)
  if (m.generation) parts.push(m.generation)
  return parts.join(' ')
}

export function modelYears(m: ModelNameFields): string {
  if (m.yearFrom && m.yearTo) return `${m.yearFrom}–${m.yearTo}`
  if (m.yearFrom) return `${m.yearFrom}–`
  return ''
}

export function modelLabel(m: ModelNameFields): string {
  const years = modelYears(m)
  const name = modelDisplayName(m)
  return years ? `${name} ${years}` : name
}
