/**
 * Dispatch-day rule (DEV_CONTEXT §5, PROJECT_CONTEXT §1): an order confirmed
 * before 15:00 Europe/Kyiv ships "Сьогодні"; after → "Завтра"; on a day off the
 * next shipment is the following working day ("У понеділок" after Saturday /
 * on Sunday). Pure over an injected `now`, evaluated in Europe/Kyiv regardless
 * of server locale. Shares the Schedule shape with the pickup-status rule.
 */
import { type Schedule, type Weekday, DEFAULT_SCHEDULE } from '@/lib/hours'

const CUTOFF_HOUR = 15

function kyivParts(now: Date): { wd: Weekday; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const map: Record<string, Weekday> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  const wd = map[parts.find((p) => p.type === 'weekday')!.value]
  const hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10) % 24
  return { wd, hour }
}

const isWorkday = (wd: Weekday, s: Schedule) => wd >= s.days[0] && wd <= s.days[1]

export type Dispatch = 'today' | 'tomorrow' | 'monday'

export function dispatchDay(
  now: Date,
  schedule: Schedule = DEFAULT_SCHEDULE,
  cutoffHour: number = CUTOFF_HOUR,
): Dispatch {
  const { wd, hour } = kyivParts(now)
  const workingToday = isWorkday(wd, schedule)

  if (workingToday && hour < cutoffHour) return 'today'

  // Ships on the next working day. Find it by stepping forward from tomorrow.
  let next = ((wd % 7) + 1) as Weekday
  for (let i = 0; i < 7; i += 1) {
    if (isWorkday(next, schedule)) break
    next = ((next % 7) + 1) as Weekday
  }
  // Monday is weekday 1; otherwise it is literally the next calendar day.
  return next === 1 ? 'monday' : 'tomorrow'
}

export const DISPATCH_LABEL_UK: Record<Dispatch, string> = {
  today: 'Сьогодні',
  tomorrow: 'Завтра',
  monday: 'У понеділок',
}

export function dispatchLabel(now: Date, schedule: Schedule = DEFAULT_SCHEDULE): string {
  return DISPATCH_LABEL_UK[dispatchDay(now, schedule)]
}
