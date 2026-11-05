'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { useWishlistCount } from '@/lib/wishlist'
import {
  CartIcon,
  CatalogIcon,
  ChevronDownIcon,
  CloseIcon,
  GlobeIcon,
  HeartIcon,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
  TelegramIcon,
  ViberIcon,
} from '@/components/ui/icons'

/**
 * Site header. Identical on every page (PROJECT_CONTEXT §2): a dark top strip
 * (uk/ru switch; banner slot in season) and a white main bar (logo, Catalog
 * trigger, search, "Замовити дзвінок", favourites / compare / cart). Three
 * layouts by width — desktop ≥1360, tablet 768–1359, mobile <768 — matching the
 * export's breakpoints, toggled with CSS. The main bar hides on scroll down and
 * reappears on scroll up (transform only). The mega-menu is an empty shell with
 * the correct trigger; contents land in a later stage.
 */

/**
 * Chrome data (phone, hours, messenger links) comes from `settings` /
 * `pickup-points` via the SiteHeader server wrapper. Defaults keep the header
 * self-contained on pages (e.g. /ui) that render it without data.
 */
export type HeaderProps = {
  phone?: string
  phoneHref?: string
  hours?: string
  telegramHref?: string
  viberHref?: string
}

const DEFAULT_PHONE = '+380 98 640 13 57'
const DEFAULT_PHONE_HREF = 'tel:+380986401357'
const DEFAULT_HOURS = 'Пн–Сб 9:00–18:00'

function useScrollReveal() {
  const [hidden, setHidden] = useState(false)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - last
      setStuck(y > 8)
      if (y <= 8) setHidden(false)
      else if (dy > 4) setHidden(true)
      else if (dy < -4) setHidden(false)
      if (Math.abs(dy) > 4) last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return { hidden, stuck }
}

function LanguageToggle({ dark = true }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-label="Мова"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="flex cursor-pointer items-center font-sans font-medium"
        style={{
          height: 'var(--icon-24)',
          gap: 'var(--space-4)',
          border: 'none',
          background: 'none',
          fontSize: 'var(--text-14)',
          color: dark ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)',
        }}
      >
        <GlobeIcon size="16" />
        UA
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0"
          style={{
            zIndex: 10,
            top: 'var(--space-32)',
            width: 'var(--space-96)',
            padding: 'var(--space-8) 0',
            background: 'var(--color-neutral-0)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {[
            { code: 'UA', href: '/' },
            { code: 'RU', href: '/ru' },
          ].map((l) => (
            <Link
              key={l.code}
              href={l.href}
              role="option"
              className="flex items-center"
              style={{
                height: 'var(--control-h-40)',
                padding: '0 var(--space-16)',
                fontSize: 'var(--text-14)',
                color: 'var(--color-neutral-900)',
                textDecoration: 'none',
              }}
            >
              {l.code}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SocialLinks({
  color,
  telegramHref = '#',
  viberHref = '#',
}: {
  color: string
  telegramHref?: string
  viberHref?: string
}) {
  return (
    <div className="flex" style={{ gap: 'var(--space-8)' }}>
      <a
        href={telegramHref}
        aria-label="Telegram"
        className="flex items-center justify-center"
        style={{ width: 'var(--icon-24)', height: 'var(--icon-24)', color }}
      >
        <TelegramIcon size="16" />
      </a>
      <a
        href={viberHref}
        aria-label="Viber"
        className="flex items-center justify-center"
        style={{ width: 'var(--icon-24)', height: 'var(--icon-24)', color }}
      >
        <ViberIcon size="16" />
      </a>
    </div>
  )
}

/** Square icon action (favourites / compare), 48 on tablet+desktop, 44 on mobile. */
function IconAction({
  label,
  href = '#',
  size = '48',
  badge = 0,
  children,
}: {
  label: string
  href?: string
  size?: '48' | '44'
  /** Count badge (e.g. wishlist size); hidden when 0. */
  badge?: number
  children: ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={badge > 0 ? `${label} (${badge})` : label}
      className="relative flex shrink-0 items-center justify-center"
      style={{
        width: size === '48' ? 'var(--control-h-48)' : 'var(--control-h-44)',
        height: size === '48' ? 'var(--control-h-48)' : 'var(--control-h-44)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-neutral-100)',
        color: 'var(--color-neutral-900)',
      }}
    >
      {children}
      {badge > 0 ? (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center text-11"
          style={{
            top: 'calc(var(--space-4) * -1)',
            right: 'calc(var(--space-4) * -1)',
            minWidth: '1.125rem',
            height: '1.125rem',
            padding: '0 0.3125rem',
            boxSizing: 'border-box',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary)',
            color: 'var(--color-neutral-0)',
            lineHeight: 1,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {badge}
        </span>
      ) : null}
    </a>
  )
}

function SearchBar() {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="flex min-w-0 flex-1 items-center"
      style={{
        height: 'var(--control-h-48)',
        boxSizing: 'border-box',
        padding: 'var(--space-4) var(--space-4) var(--space-4) 0',
        gap: 'var(--space-8)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-neutral-100)',
      }}
    >
      <input
        type="search"
        aria-label="Пошук запчастин"
        placeholder="Пошук запчастин"
        className="min-w-0 flex-1 font-sans"
        style={{
          height: 'var(--control-h-40)',
          boxSizing: 'border-box',
          padding: '0 var(--space-16)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          fontSize: 'var(--text-16)',
          color: 'var(--color-neutral-900)',
        }}
      />
      <button
        type="submit"
        aria-label="Знайти"
        className="flex shrink-0 cursor-pointer items-center justify-center"
        style={{
          width: 'var(--control-h-40)',
          height: 'var(--control-h-40)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-neutral-200)',
          color: 'var(--color-neutral-900)',
        }}
      >
        <SearchIcon size="20" />
      </button>
    </form>
  )
}

function Logo({ size }: { size: 'sm' | 'lg' }) {
  return (
    <Link
      href="/"
      aria-label="DLSAuto — на головну"
      className="font-sans font-semibold no-underline"
      style={{
        fontSize: size === 'lg' ? 'var(--text-28)' : 'var(--text-20)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        color: 'var(--color-neutral-900)',
      }}
    >
      DLSAuto
    </Link>
  )
}

function CatalogTrigger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      className="dls-fill flex cursor-pointer items-center font-sans font-semibold"
      style={{
        height: 'var(--control-h-48)',
        padding: '0 var(--space-16)',
        gap: 'var(--space-8)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-neutral-0)',
        fontSize: 'var(--text-16)',
        ['--dls-fill' as string]: 'var(--color-primary-dark)',
      }}
    >
      <CatalogIcon size="20" />
      Каталог
      <ChevronDownIcon
        size="16"
        style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform var(--duration-200) ease',
        }}
      />
    </button>
  )
}

export function Header({
  phone = DEFAULT_PHONE,
  phoneHref = DEFAULT_PHONE_HREF,
  hours = DEFAULT_HOURS,
  telegramHref = '#',
  viberHref = '#',
}: HeaderProps = {}) {
  const { hidden, stuck } = useScrollReveal()
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen((o) => !o)
  const favCount = useWishlistCount()

  const barStyle = {
    background: 'var(--color-neutral-0)',
    transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
    boxShadow: stuck && !hidden ? 'var(--shadow-md)' : 'none',
    transition:
      'transform var(--duration-300) var(--ease-brand), box-shadow var(--duration-300) var(--ease-brand)',
  }

  return (
    <header className="font-sans" style={{ background: 'var(--color-neutral-950)' }}>
      {/* ---------------------------------------------------- dark top strip */}
      {/* mobile */}
      <div
        className="flex items-center justify-between md:hidden"
        style={{
          padding: '0 var(--space-16)',
          height: 'var(--control-h-48)',
          fontSize: 'var(--text-14)',
          color: 'var(--color-neutral-300)',
        }}
      >
        <span>{hours}</span>
        <a
          href={phoneHref}
          className="flex items-center font-medium no-underline"
          style={{ height: 'var(--control-h-48)', color: 'var(--color-neutral-0)' }}
        >
          {phone}
        </a>
      </div>
      {/* tablet + desktop */}
      <div className="hidden md:block">
        <div
          className="mx-auto flex items-center justify-between"
          style={{
            maxWidth: 'calc(var(--container-max) + 2 * var(--dls-pad))',
            ['--dls-pad' as string]: 'var(--space-32)',
            paddingInline: 'var(--dls-pad)',
            height: 'var(--control-h-40)',
            gap: 'var(--space-24)',
            fontSize: 'var(--text-14)',
            color: 'var(--color-neutral-300)',
          }}
        >
          <nav className="hidden wide:flex" style={{ gap: 'var(--space-16)' }}>
            <a href="#" className="no-underline" style={{ color: 'var(--color-neutral-300)' }}>
              Про нас
            </a>
            <a href="#" className="no-underline" style={{ color: 'var(--color-neutral-300)' }}>
              Гарантія та повернення
            </a>
            <Link
              href="/contacts"
              className="no-underline"
              style={{ color: 'var(--color-neutral-300)' }}
            >
              Контакти
            </Link>
          </nav>
          <div className="flex items-center" style={{ gap: 'var(--space-16)', marginLeft: 'auto' }}>
            <span className="hidden wide:inline">{hours}</span>
            <a
              href={phoneHref}
              className="font-medium no-underline"
              style={{ color: 'var(--color-neutral-0)' }}
            >
              {phone}
            </a>
            <SocialLinks
              color="var(--color-neutral-300)"
              telegramHref={telegramHref}
              viberHref={viberHref}
            />
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- white main bar */}
      <div className="sticky top-0 z-[900]">
        <div style={barStyle}>
          {/* mobile main bar */}
          <div
            className="flex items-center md:hidden"
            style={{
              padding: '0 var(--space-16)',
              height: 'var(--space-64)',
              gap: 'var(--space-12)',
            }}
          >
            <button
              type="button"
              aria-label="Меню"
              aria-expanded={menuOpen}
              onClick={toggleMenu}
              className="flex cursor-pointer items-center justify-center"
              style={{
                width: 'var(--control-h-44)',
                height: 'var(--control-h-44)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-neutral-100)',
                color: 'var(--color-neutral-900)',
              }}
            >
              {menuOpen ? <CloseIcon size="24" /> : <MenuIcon size="24" />}
            </button>
            <Logo size="sm" />
            <div
              className="flex items-center"
              style={{ gap: 'var(--space-8)', marginLeft: 'auto' }}
            >
              <IconAction label={`Зателефонувати: ${phone}`} href={phoneHref} size="44">
                <PhoneIcon size="24" />
              </IconAction>
              <IconAction label="Обране" size="44" badge={favCount}>
                <HeartIcon size="24" />
              </IconAction>
              <a
                href="#"
                aria-label="Кошик"
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 'var(--control-h-44)',
                  height: 'var(--control-h-44)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-neutral-0)',
                }}
              >
                <CartIcon size="24" />
              </a>
            </div>
          </div>

          {/* tablet + desktop main bar */}
          <div className="hidden md:block">
            <div
              className="mx-auto flex items-center"
              style={{
                maxWidth: 'calc(var(--container-max) + 2 * var(--dls-pad))',
                ['--dls-pad' as string]: 'var(--space-32)',
                paddingInline: 'var(--dls-pad)',
                height: 'var(--space-80)',
                gap: 'var(--space-16)',
              }}
            >
              {/* tablet shows a hamburger; desktop shows the Catalog pill */}
              <button
                type="button"
                aria-label="Меню"
                aria-expanded={menuOpen}
                onClick={toggleMenu}
                className="flex cursor-pointer items-center justify-center wide:hidden"
                style={{
                  width: 'var(--control-h-48)',
                  height: 'var(--control-h-48)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-neutral-100)',
                  color: 'var(--color-neutral-900)',
                }}
              >
                {menuOpen ? <CloseIcon size="24" /> : <MenuIcon size="24" />}
              </button>
              <Logo size="lg" />
              <div className="hidden wide:block">
                <CatalogTrigger open={menuOpen} onClick={toggleMenu} />
              </div>
              <div className="flex min-w-0 flex-1 items-center" style={{ gap: 'var(--space-16)' }}>
                <div className="hidden min-w-0 flex-1 wide:flex">
                  <SearchBar />
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Button variant="secondary" size="md" onClick={() => undefined}>
                    Замовити дзвінок
                  </Button>
                </div>
                <IconAction label="Обране" badge={favCount}>
                  <HeartIcon size="24" />
                </IconAction>
                <a
                  href="#"
                  aria-label="Кошик"
                  className="dls-fill flex shrink-0 items-center font-sans font-semibold no-underline"
                  style={{
                    height: 'var(--control-h-48)',
                    padding: '0 var(--space-16)',
                    gap: 'var(--space-8)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-neutral-0)',
                    fontSize: 'var(--text-16)',
                    ['--dls-fill' as string]: 'var(--color-primary-dark)',
                  }}
                >
                  <CartIcon size="20" />
                  Кошик
                </a>
              </div>
            </div>
            {/* tablet search row */}
            <div className="wide:hidden">
              <div
                className="mx-auto"
                style={{
                  maxWidth: 'calc(var(--container-max) + 2 * var(--dls-pad))',
                  ['--dls-pad' as string]: 'var(--space-32)',
                  paddingInline: 'var(--dls-pad)',
                  paddingBottom: 'var(--space-16)',
                }}
              >
                <SearchBar />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------- mega-menu shell (empty) */}
      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[800] cursor-default"
            style={{ background: 'var(--color-scrim)', border: 'none' }}
          />
          <div
            role="dialog"
            aria-label="Каталог"
            className="absolute inset-x-0 z-[850]"
            style={{
              background: 'var(--color-neutral-0)',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              minHeight: 'var(--space-96)',
            }}
          >
            {/* Mega-menu content is built in a later stage. */}
          </div>
        </>
      ) : null}
    </header>
  )
}
