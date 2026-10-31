/**
 * Pickup-point working-hours status, evaluated in Europe/Kyiv (PROJECT_CONTEXT
 * §5). Pure function over an injected `now` so it is testable and
 * timezone-correct regardless of server locale.
 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7 // Mon..Sun

export type Schedule = {
  /** First and last weekday that are open (inclusive), e.g. Mon–Sat = [1, 6]. */
  days: [Weekday, Weekday]
  /** Opening / closing hour in 24h local time. */
  openHour: number
  closeHour: number
}

/** Mon–Sat 9:00–18:00 — the current DLSAuto schedule (placeholder until confirmed). */
export const DEFAULT_SCHEDULE: Schedule = { days: [1, 6], openHour: 9, closeHour: 18 }

function kyivNow(now: Date): { wd: Weekday; hour: number } {
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

export type OpenStatus = { open: boolean; label: string }

export function pickupStatus(now: Date, schedule: Schedule = DEFAULT_SCHEDULE): OpenStatus {
  const { wd, hour } = kyivNow(now)
  const [from, to] = schedule.days
  const inWorkday = wd >= from && wd <= to
  const open = inWorkday && hour >= schedule.openHour && hour < schedule.closeHour

  if (open) return { open, label: `Зараз відкрито, працюємо до ${schedule.closeHour}:00` }
  if (inWorkday && hour < schedule.openHour)
    return { open, label: `Зачинено, відкриємось сьогодні о ${schedule.openHour}:00` }
  // After close today, or a day off → opens next working day.
  const opensMonday = wd === to || wd === 7
  return {
    open,
    label: opensMonday
      ? `Зачинено, відкриємось у понеділок о ${schedule.openHour}:00`
      : `Зачинено, відкриємось завтра о ${schedule.openHour}:00`,
  }
}
