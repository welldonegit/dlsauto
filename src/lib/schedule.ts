import { pickupStatus, type OpenStatus, type Schedule, type Weekday } from '@/lib/hours'

/**
 * Bridge between the pickup-points `schedule` group (admin data) and the pure
 * hours rule. When open/close hours are not set, the schedule is treated as
 * unconfirmed → label "графік уточнюється" and no live status (DEV_CONTEXT §5,
 * PROJECT_CONTEXT §1: Дніпро schedule pending the client).
 */
export type PickupSchedule =
  | {
      dayFrom?: string | null
      dayTo?: string | null
      openHour?: number | null
      closeHour?: number | null
    }
  | null
  | undefined

const DAY_SHORT = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

function toSchedule(s: PickupSchedule): Schedule | null {
  if (!s || s.openHour == null || s.closeHour == null) return null
  const from = Number(s.dayFrom ?? 1) as Weekday
  const to = Number(s.dayTo ?? 6) as Weekday
  return { days: [from, to], openHour: s.openHour, closeHour: s.closeHour }
}

export function formatScheduleLabel(s: PickupSchedule): string {
  const sched = toSchedule(s)
  if (!sched) return 'графік уточнюється'
  const [from, to] = sched.days
  return `${DAY_SHORT[from]}–${DAY_SHORT[to]} ${sched.openHour}:00–${sched.closeHour}:00`
}

export function pickupOpenStatus(s: PickupSchedule, now: Date): OpenStatus | null {
  const sched = toSchedule(s)
  return sched ? pickupStatus(now, sched) : null
}
