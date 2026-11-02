'use client'

import { useState, type ReactNode } from 'react'

import { Accordion } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { Button, CircleArrow } from '@/components/ui/Button'
import { RichText, type LexRoot } from '@/components/ui/RichText'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Stars } from '@/components/ui/Stars'
import { StatusDot } from '@/components/ui/StatusDot'
import { Toast } from '@/components/ui/Toast'
import { Tooltip } from '@/components/ui/Tooltip'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Checkbox, PhoneField, Select, TextArea, TextField } from '@/components/ui/fields'
import { ArrowRightIcon, HeartIcon, SearchIcon } from '@/components/ui/icons'

/* Token reference data (literal values live here only for display labels). */
const COLORS: { name: string; v: string; hex: string }[] = [
  { name: 'neutral-0', v: 'var(--color-neutral-0)', hex: '#FCFCFD' },
  { name: 'neutral-white', v: 'var(--color-neutral-white)', hex: '#FFFFFF' },
  { name: 'neutral-50', v: 'var(--color-neutral-50)', hex: '#F6F6F6' },
  { name: 'neutral-100', v: 'var(--color-neutral-100)', hex: '#F3F5F7' },
  { name: 'neutral-200', v: 'var(--color-neutral-200)', hex: '#E6E9EE' },
  { name: 'neutral-300', v: 'var(--color-neutral-300)', hex: '#CDD2DA' },
  { name: 'neutral-400', v: 'var(--color-neutral-400)', hex: '#A9B0BB' },
  { name: 'neutral-500', v: 'var(--color-neutral-500)', hex: '#6B7380' },
  { name: 'neutral-600', v: 'var(--color-neutral-600)', hex: '#4A5260' },
  { name: 'neutral-800', v: 'var(--color-neutral-800)', hex: '#2A303A' },
  { name: 'neutral-900', v: 'var(--color-neutral-900)', hex: '#1E232B' },
  { name: 'neutral-950', v: 'var(--color-neutral-950)', hex: '#12161C' },
  { name: 'primary', v: 'var(--color-primary)', hex: '#E0001B' },
  { name: 'primary-dark', v: 'var(--color-primary-dark)', hex: '#C00017' },
  { name: 'primary-dark-2', v: 'var(--color-primary-dark-2)', hex: '#B80016' },
  { name: 'success', v: 'var(--color-success)', hex: '#1F8A4C' },
  { name: 'success-open', v: 'var(--color-success-open)', hex: '#1E9E5A' },
  { name: 'success-tint', v: 'var(--color-success-tint)', hex: '#E7F4EC' },
  { name: 'error', v: 'var(--color-error)', hex: '#C62828' },
]

const TYPE: { name: string; note: string }[] = [
  { name: 'd', note: 'Hero H1 — 56' },
  { name: '40', note: 'H1 / H2 desktop' },
  { name: '32', note: 'H1 mobile / H2' },
  { name: '28', note: 'H2 tablet' },
  { name: '24', note: 'H2 mobile' },
  { name: '20', note: 'Lead / subhead' },
  { name: '18', note: 'Body-lg / card title' },
  { name: '16', note: 'Body' },
  { name: '14', note: 'Small' },
  { name: '13', note: 'XS / hints' },
  { name: '12', note: 'Label' },
  { name: '11', note: 'Badge' },
]

const SPACES = ['4', '8', '12', '16', '24', '32', '40', '48', '64', '80', '96', '128']
const RADII = [
  { name: 'xs', v: 'var(--radius-xs)' },
  { name: 'sm', v: 'var(--radius-sm)' },
  { name: 'md', v: 'var(--radius-md)' },
  { name: 'lg', v: 'var(--radius-lg)' },
  { name: 'full', v: 'var(--radius-full)' },
]
const SHADOWS = [
  { name: 'sm', v: 'var(--shadow-sm)' },
  { name: 'md', v: 'var(--shadow-md)' },
  { name: 'lg', v: 'var(--shadow-lg)' },
]

/* richText typography sample for the UI kit (headings, lists, link, marks). */
const RICHTEXT_SAMPLE: LexRoot = {
  root: {
    type: 'root',
    children: [
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Заголовок розділу' }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Абзац із ' },
          { type: 'text', format: 1, text: 'жирним' },
          { type: 'text', text: ', ' },
          { type: 'text', format: 2, text: 'курсивом' },
          { type: 'text', text: ' та ' },
          { type: 'link', fields: { url: '/' }, children: [{ type: 'text', text: 'посиланням' }] },
          { type: 'text', text: '.' },
        ],
      },
      {
        type: 'list',
        listType: 'bullet',
        children: [
          { type: 'listitem', children: [{ type: 'text', text: 'Перший пункт списку' }] },
          { type: 'listitem', children: [{ type: 'text', text: 'Другий пункт списку' }] },
        ],
      },
    ],
  },
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 'var(--space-64)' }}>
      <h2
        className="font-semibold text-28"
        style={{ margin: '0 0 var(--space-24)', letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Panel({ dark = false, children }: { dark?: boolean; children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center"
      style={{
        gap: 'var(--space-16)',
        padding: 'var(--space-24)',
        borderRadius: 'var(--radius-lg)',
        background: dark ? 'var(--color-neutral-950)' : 'var(--color-neutral-100)',
        border: 'var(--border-hairline) solid var(--color-neutral-200)',
      }}
    >
      {children}
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-16)' }}>
      {children}
    </div>
  )
}

export function UiShowcase() {
  const [phone, setPhone] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <main
      className="font-sans"
      style={{
        maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))',
        margin: '0 auto',
        padding: 'var(--space-48) var(--space-24) var(--space-128)',
        color: 'var(--color-neutral-900)',
      }}
    >
      <h1 className="font-semibold text-40" style={{ margin: 0, letterSpacing: '-0.02em' }}>
        DLSAuto — UI kit
      </h1>
      <p
        style={{
          margin: 'var(--space-8) 0 0',
          color: 'var(--color-neutral-600)',
          fontSize: 'var(--text-16)',
        }}
      >
        Токени й компоненти системи. Значення — з <code>globals.css</code> (
        <code>docs/DESIGN_TOKENS.md</code>).
      </p>

      {/* ---------------------------------------------------------- Colours */}
      <Block title="Палітра">
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(var(--space-160), 1fr))',
            gap: 'var(--space-16)',
          }}
        >
          {COLORS.map((c) => (
            <div key={c.name} className="flex flex-col" style={{ gap: 'var(--space-8)' }}>
              <div
                style={{
                  height: 'var(--space-64)',
                  borderRadius: 'var(--radius-sm)',
                  background: c.v,
                  border: 'var(--border-hairline) solid var(--color-neutral-200)',
                }}
              />
              <div style={{ fontSize: 'var(--text-13)' }}>
                <div className="font-semibold">--color-{c.name}</div>
                <div style={{ color: 'var(--color-neutral-500)' }}>{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* ------------------------------------------------------ Typography */}
      <Block title="Типографіка">
        <div className="flex flex-col" style={{ gap: 'var(--space-16)' }}>
          {TYPE.map((t) => (
            <div
              key={t.name}
              className="flex flex-wrap items-baseline"
              style={{ gap: 'var(--space-16)' }}
            >
              <span
                style={{
                  fontSize: `var(--text-${t.name})`,
                  lineHeight: `var(--text-${t.name}--line-height)`,
                  fontWeight: 600,
                  letterSpacing: ['d', '40', '32', '28', '24'].includes(t.name)
                    ? '-0.02em'
                    : undefined,
                }}
              >
                Б/в запчастини
              </span>
              <span style={{ fontSize: 'var(--text-13)', color: 'var(--color-neutral-500)' }}>
                text-{t.name} — {t.note}
              </span>
            </div>
          ))}
          <Row>
            <span style={{ fontSize: 'var(--text-16)', fontWeight: 400 }}>Regular 400</span>
            <span style={{ fontSize: 'var(--text-16)', fontWeight: 500 }}>Medium 500</span>
            <span style={{ fontSize: 'var(--text-16)', fontWeight: 600 }}>Semibold 600</span>
          </Row>
        </div>
      </Block>

      {/* --------------------------------------------------------- Spacing */}
      <Block title="Відступи">
        <div className="flex flex-col" style={{ gap: 'var(--space-8)' }}>
          {SPACES.map((s) => (
            <div key={s} className="flex items-center" style={{ gap: 'var(--space-16)' }}>
              <span
                style={{
                  width: 'var(--space-48)',
                  fontSize: 'var(--text-13)',
                  color: 'var(--color-neutral-500)',
                }}
              >
                {s}
              </span>
              <span
                style={{
                  height: 'var(--space-16)',
                  width: `var(--space-${s})`,
                  background: 'var(--color-primary)',
                  borderRadius: 'var(--radius-xs)',
                }}
              />
            </div>
          ))}
        </div>
      </Block>

      {/* ----------------------------------------------- Radii / shadows */}
      <Block title="Радіуси · тіні · рамки">
        <Row>
          {RADII.map((r) => (
            <div
              key={r.name}
              className="flex flex-col items-center"
              style={{ gap: 'var(--space-8)' }}
            >
              <div
                style={{
                  width: 'var(--space-80)',
                  height: 'var(--space-80)',
                  background: 'var(--color-neutral-white)',
                  border: 'var(--border-hairline) solid var(--color-neutral-300)',
                  borderRadius: r.v,
                }}
              />
              <span style={{ fontSize: 'var(--text-13)', color: 'var(--color-neutral-500)' }}>
                radius-{r.name}
              </span>
            </div>
          ))}
        </Row>
        <div
          className="flex flex-wrap"
          style={{ gap: 'var(--space-24)', marginTop: 'var(--space-24)' }}
        >
          {SHADOWS.map((sh) => (
            <div
              key={sh.name}
              className="flex flex-col items-center"
              style={{ gap: 'var(--space-8)' }}
            >
              <div
                style={{
                  width: 'var(--space-128)',
                  height: 'var(--space-80)',
                  background: 'var(--color-neutral-white)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: sh.v,
                }}
              />
              <span style={{ fontSize: 'var(--text-13)', color: 'var(--color-neutral-500)' }}>
                shadow-{sh.name}
              </span>
            </div>
          ))}
        </div>
      </Block>

      {/* --------------------------------------------------------- Buttons */}
      <Block title="Кнопки">
        {(['primary', 'secondary', 'tertiary'] as const).map((variant) => (
          <div key={variant} style={{ marginBottom: 'var(--space-16)' }}>
            <Panel>
              <Button variant={variant} size="lg">
                L — Надіслати
              </Button>
              <Button variant={variant} size="md">
                M — Надіслати
              </Button>
              <Button variant={variant} size="sm">
                S — Надіслати
              </Button>
              <Button variant={variant} size="md" forceState="hover">
                hover
              </Button>
              <Button variant={variant} size="md" forceState="focus">
                focus
              </Button>
              <Button variant={variant} size="md" forceState="disabled">
                disabled
              </Button>
            </Panel>
          </div>
        ))}
        <Panel dark>
          <Button variant="primary" size="md" onDark>
            On dark
          </Button>
          <Button variant="secondary" size="md" onDark>
            On dark
          </Button>
          <Button variant="tertiary" size="md" onDark>
            On dark
          </Button>
          <CircleArrow size="S" onDark />
          <CircleArrow size="XL" onDark />
        </Panel>
      </Block>

      {/* ----------------------------------------------------- Round arrow */}
      <Block title="Кругла стрілка">
        <Panel>
          <CircleArrow size="S" />
          <CircleArrow size="S" forceState="hover" />
          <CircleArrow size="XL" />
          <CircleArrow size="XL" forceState="hover" />
        </Panel>
      </Block>

      {/* --------------------------------------------------- Badges / dots */}
      <Block title="Бейджі · статуси">
        <Row>
          <Badge variant="neutral">Нове</Badge>
          <Badge variant="neutral">Популярне</Badge>
          <Badge variant="primary">−20%</Badge>
          <Badge variant="success">Перевірено</Badge>
          <StatusDot open>Зараз відкрито</StatusDot>
          <StatusDot open={false}>Зачинено</StatusDot>
        </Row>
      </Block>

      {/* ----------------------------------------------------------- Forms */}
      <Block title="Поля форми">
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 'var(--space-16)', maxWidth: 'var(--space-320)' }}
        >
          <TextField label="Марка і модель авто" />
          <TextField label="Що шукаєте" required />
          <TextField label="З помилкою" required error="Заповніть це поле" />
          <TextField label="У фокусі" forceState="focus" />
          <PhoneField value={phone} onValueChange={setPhone} required />
          <Select
            label="Пункт видачі"
            options={[
              { value: 'zp', label: 'Запоріжжя' },
              { value: 'dp', label: 'Дніпро' },
            ]}
          />
        </div>
        <div style={{ marginTop: 'var(--space-16)', maxWidth: 'var(--space-320)' }}>
          <TextArea label="Повідомлення" />
        </div>
        <div style={{ marginTop: 'var(--space-16)' }}>
          <Checkbox label="Погоджуюсь з політикою конфіденційності" />
        </div>
      </Block>

      {/* ----------------------------------------- Tooltip / accordion / toast */}
      <Block title="Tooltip · Accordion · Toast">
        <Row>
          <Tooltip content="Ranger 2006–2012">
            <span
              style={{
                fontSize: 'var(--text-14)',
                color: 'var(--color-neutral-600)',
                textDecoration: 'underline',
              }}
            >
              Донор (наведіть)
            </span>
          </Tooltip>
          <Tooltip content="Завжди видно" forceOpen>
            <span style={{ fontSize: 'var(--text-14)', color: 'var(--color-neutral-600)' }}>
              forceOpen
            </span>
          </Tooltip>
          <Button variant="secondary" size="sm" onClick={() => setToastOpen(true)}>
            Показати тост
          </Button>
        </Row>
        <div style={{ maxWidth: 'var(--space-320)', marginTop: 'var(--space-24)' }}>
          <Accordion
            defaultOpen={['a']}
            items={[
              {
                id: 'a',
                title: 'Яка гарантія?',
                content: (
                  <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
                    14 / 30 / до 60 днів.
                  </p>
                ),
              },
              {
                id: 'b',
                title: 'Як оплатити?',
                content: (
                  <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
                    Карткою онлайн або готівкою.
                  </p>
                ),
              },
            ]}
          />
        </div>
        <Toast
          open={toastOpen}
          title="Додано в обране"
          description="Фара ліва Ford Ranger"
          onClose={() => setToastOpen(false)}
        />
      </Block>

      {/* ------------------------------------------------ Stage 3a pieces */}
      <Block title="Етап 3a — нові елементи">
        <p
          style={{
            margin: '0 0 var(--space-16)',
            color: 'var(--color-neutral-600)',
            fontSize: 'var(--text-14)',
          }}
        >
          Зірки відгуків і типографіка richText. Складені блоки сторінок (диск «Про компанію»,
          «DLSAuto в цифрах», «Шлях деталі», «Що ще ми робимо», відгуки, CTA) — у русі на{' '}
          <code>/about</code>; юридична типографіка — на <code>/policy</code> та{' '}
          <code>/oferta</code>; 404 — на будь-якій неіснуючій адресі.
        </p>
        <Row>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center" style={{ gap: 'var(--space-8)' }}>
              <Stars rating={n} size="20" label={`${n} з 5`} />
              <span style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--text-13)' }}>
                {n}/5
              </span>
            </div>
          ))}
        </Row>
        <div
          style={{
            marginTop: 'var(--space-24)',
            maxWidth: '47.5rem',
            fontSize: 'var(--text-16)',
            color: 'var(--color-neutral-900)',
          }}
        >
          <RichText content={RICHTEXT_SAMPLE} />
        </div>
      </Block>

      {/* ----------------------------------------- Headings / breadcrumbs */}
      <Block title="Заголовки · крихти">
        <Breadcrumbs items={[{ label: 'Головна', href: '/' }, { label: 'Контакти' }]} />
        <div style={{ marginTop: 'var(--space-24)' }}>
          <SectionHeading eyebrow="Крок" step={{ num: '01', title: 'Оберіть марку' }}>
            Деталі для вашого авто
          </SectionHeading>
        </div>
      </Block>

      {/* --------------------------------------------- Mobile width preview */}
      <Block title="Мобільна ширина (390px)">
        <div
          style={{
            width: 'var(--space-390, 24.375rem)',
            maxWidth: '100%',
            border: 'var(--border-hairline) solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-16)',
          }}
        >
          <SectionHeading as="h2">Як нас знайти</SectionHeading>
          <div
            style={{
              marginTop: 'var(--space-16)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-12)',
            }}
          >
            <Button variant="primary" size="lg" fullWidth>
              Надіслати
            </Button>
            <Row>
              <Badge variant="primary">−20%</Badge>
              <StatusDot open>Відкрито</StatusDot>
              <span style={{ color: 'var(--color-neutral-600)' }}>
                <HeartIcon size="24" />
              </span>
              <span style={{ color: 'var(--color-neutral-600)' }}>
                <SearchIcon size="24" />
              </span>
              <span style={{ color: 'var(--color-primary)' }}>
                <ArrowRightIcon size="24" />
              </span>
            </Row>
          </div>
        </div>
      </Block>
    </main>
  )
}
