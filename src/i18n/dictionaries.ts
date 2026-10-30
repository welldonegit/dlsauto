import type { Locale } from './config'
import ru from './ru.json'
import uk from './uk.json'

// uk is the canonical shape; ru must mirror it.
export type Dictionary = typeof uk

const dictionaries: Record<Locale, Dictionary> = { uk, ru }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
