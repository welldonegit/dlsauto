import { getPickupPoints, getSettings } from '@/lib/data'
import { formatScheduleLabel } from '@/lib/schedule'

import { Header } from './Header'

/**
 * Server wrapper that feeds the (client) Header with data from `settings` and
 * the default `pickup-points` schedule. Layout is unchanged — only the values
 * now come from the admin.
 */
export async function SiteHeader() {
  const [settings, points] = await Promise.all([getSettings(), getPickupPoints()])
  const phone = settings.phones?.[0]?.number ?? undefined
  const phoneHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : undefined
  const defaultPoint = points.find((p) => p.isDefault) ?? points[0]
  const hours = defaultPoint ? formatScheduleLabel(defaultPoint.schedule) : undefined

  return (
    <Header
      phone={phone}
      phoneHref={phoneHref}
      hours={hours}
      telegramHref={settings.messengers?.telegram ?? undefined}
      viberHref={settings.messengers?.viber ?? undefined}
    />
  )
}
