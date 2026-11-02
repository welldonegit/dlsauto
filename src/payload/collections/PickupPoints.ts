import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'

/**
 * Pickup points (DEV_CONTEXT §4): name, address, schedule, mapCoords, phone,
 * isDefault. `schedule` is structured (weekday range + open/close hour) so the
 * "Зараз відкрито" status can be computed in Europe/Kyiv (src/lib/hours).
 * Scales to N points. Dnipro values are placeholders until the client confirms.
 */
const WEEKDAYS = [
  { label: 'Понеділок', value: '1' },
  { label: 'Вівторок', value: '2' },
  { label: 'Середа', value: '3' },
  { label: 'Четвер', value: '4' },
  { label: "П'ятниця", value: '5' },
  { label: 'Субота', value: '6' },
  { label: 'Неділя', value: '7' },
]

export const PickupPoints: CollectionConfig = {
  slug: 'pickup-points',
  labels: { singular: 'Пункт видачі', plural: 'Пункти видачі' },
  orderable: true,
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address', 'phone', 'isDefault'],
    group: 'Система',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Місто / назва', localized: true },
    { name: 'address', type: 'text', required: true, label: 'Адреса', localized: true },
    { name: 'phone', type: 'text', label: 'Телефон' },
    {
      name: 'schedule',
      type: 'group',
      label: 'Графік роботи',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'dayFrom',
              type: 'select',
              options: WEEKDAYS,
              defaultValue: '1',
              label: 'З дня',
            },
            {
              name: 'dayTo',
              type: 'select',
              options: WEEKDAYS,
              defaultValue: '6',
              label: 'По день',
            },
            {
              name: 'openHour',
              type: 'number',
              defaultValue: 9,
              min: 0,
              max: 23,
              label: 'Відкриття (год)',
            },
            {
              name: 'closeHour',
              type: 'number',
              defaultValue: 18,
              min: 0,
              max: 24,
              label: 'Закриття (год)',
            },
          ],
        },
      ],
    },
    {
      name: 'mapCoords',
      type: 'group',
      label: 'Координати на карті',
      admin: { description: 'Для маркера на карті.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'lat', type: 'number', label: 'Широта (lat)' },
            { name: 'lng', type: 'number', label: 'Довгота (lng)' },
          ],
        },
      ],
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      label: 'Пункт за замовчуванням',
    },
  ],
}
