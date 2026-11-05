import { dispatchLabel } from '@/lib/rules'

import type { BlockComponentProps } from './BlockRenderer'
import { Benefits, type BenefitCard } from './Benefits'

/**
 * "Переваги" server wrapper. Shapes the block items into cards and computes the
 * initial ship-day label server-side (so hydration matches); the client then
 * keeps it live on the minute.
 */
export function BenefitsBlock({ items, locale: _locale }: BlockComponentProps<'benefits'>) {
  const cards: BenefitCard[] = (items ?? []).map((it) => ({
    label: it.label ?? '',
    badge: it.badge ?? '',
    shipDay: !!it.shipDay,
    value: it.value ?? '',
    icon: (it.icon ?? 'tread') as BenefitCard['icon'],
    note: it.note ?? '',
    tag: it.tag ?? '',
    pairs: (it.pairs ?? []).map((p) => ({ k: p.k ?? '', v: p.v ?? '' })),
  }))
  if (!cards.length) return null
  void _locale

  return <Benefits items={cards} shipLabel={dispatchLabel(new Date())} />
}
