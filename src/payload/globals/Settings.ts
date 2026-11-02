import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '../access'

/**
 * Site settings (DEV_CONTEXT §4): phones, email, messengers, socials, Prom
 * rating, marketplace links, minimum order, dispatch cutoff, prepayment terms,
 * "Приймаємо" block, ФОП details, season, KeyCRM base URL. Text conditions are
 * localized; the header, footer and "Контакти" read from here.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Налаштування',
  access: { read: anyone, update: isAdmin },
  admin: { group: 'Система' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Контакти',
          fields: [
            {
              name: 'phones',
              type: 'array',
              label: 'Телефони',
              fields: [{ name: 'number', type: 'text', required: true, label: 'Номер' }],
            },
            { name: 'email', type: 'email', label: 'Email' },
            {
              name: 'messengers',
              type: 'group',
              label: 'Месенджери',
              fields: [
                { name: 'telegram', type: 'text', label: 'Telegram (посилання)' },
                { name: 'viber', type: 'text', label: 'Viber (посилання)' },
              ],
            },
            {
              name: 'socials',
              type: 'group',
              label: 'Соцмережі',
              fields: [
                { name: 'telegram', type: 'text', label: 'Telegram' },
                { name: 'viber', type: 'text', label: 'Viber' },
                { name: 'tiktok', type: 'text', label: 'TikTok' },
                { name: 'instagram', type: 'text', label: 'Instagram' },
                { name: 'facebook', type: 'text', label: 'Facebook' },
              ],
            },
          ],
        },
        {
          label: 'Маркетплейси',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'promRating', type: 'number', min: 0, max: 5, label: 'Рейтинг на Prom' },
                { name: 'promReviewsCount', type: 'number', label: 'К-сть відгуків на Prom' },
              ],
            },
            {
              name: 'marketplaces',
              type: 'group',
              label: 'Посилання',
              fields: [
                { name: 'prom', type: 'text', label: 'Prom.ua' },
                { name: 'avtopro', type: 'text', label: 'avto.pro' },
                { name: 'olx', type: 'text', label: 'OLX' },
              ],
            },
          ],
        },
        {
          label: 'Замовлення',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'minOrder',
                  type: 'number',
                  defaultValue: 500,
                  label: 'Мінімальне замовлення, ₴',
                },
                {
                  name: 'dispatchCutoffHour',
                  type: 'number',
                  defaultValue: 15,
                  min: 0,
                  max: 23,
                  label: 'Відправка в день замовлення до (год)',
                },
              ],
            },
            {
              name: 'prepaymentConditions',
              type: 'textarea',
              localized: true,
              label: 'Умови передоплати',
            },
            {
              name: 'acceptBlock',
              type: 'textarea',
              localized: true,
              label: 'Блок «Приймаємо»',
            },
            {
              name: 'keycrmBaseUrl',
              type: 'text',
              label: 'KeyCRM base URL (для посилань на замовлення)',
            },
          ],
        },
        {
          label: 'ФОП',
          fields: [
            {
              name: 'fop',
              type: 'group',
              label: 'Реквізити ФОП',
              fields: [
                { name: 'name', type: 'text', label: 'Назва / ПІБ' },
                { name: 'edrpou', type: 'text', label: 'ЄДРПОУ / ІПН' },
                { name: 'address', type: 'text', label: 'Адреса' },
              ],
            },
          ],
        },
        {
          label: 'Сезон',
          fields: [
            {
              name: 'season',
              type: 'group',
              label: 'Святковий режим',
              fields: [
                {
                  name: 'current',
                  type: 'select',
                  defaultValue: 'none',
                  label: 'Активний сезон',
                  options: [
                    { label: 'Немає', value: 'none' },
                    { label: 'Геловін', value: 'halloween' },
                    { label: 'Новий рік', value: 'new_year' },
                    { label: 'Великдень', value: 'easter' },
                  ],
                },
                {
                  name: 'manualOverride',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Перемкнути вручну (ігнорувати дати)',
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'dateFrom', type: 'date', label: 'Початок' },
                    { name: 'dateTo', type: 'date', label: 'Кінець' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
