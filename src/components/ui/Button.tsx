import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { ArrowRightIcon, type IconSize } from './icons'

/**
 * The one button. Three hierarchy levels × three sizes, on light or dark
 * backgrounds (DESIGN_RULES §4, PROJECT_CONTEXT §2). Identical everywhere:
 * same signature centre-fill on hover (.dls-fill). Renders an <a> when `href`
 * is given, otherwise a <button>.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary'
export type ButtonSize = 'sm' | 'md' | 'lg'

const HEIGHT: Record<ButtonSize, string> = {
  sm: 'var(--control-h-40)',
  md: 'var(--control-h-48)',
  lg: 'var(--control-h-56)',
}
const PAD_X: Record<ButtonSize, string> = {
  sm: 'var(--space-16)',
  md: 'var(--space-24)',
  lg: 'var(--space-32)',
}

type Common = {
  variant?: ButtonVariant
  size?: ButtonSize
  onDark?: boolean
  fullWidth?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** Static state for the /ui showcase — renders a state without interaction. */
  forceState?: 'hover' | 'focus' | 'disabled'
  children: ReactNode
}
type AsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { href?: undefined }
type AsAnchor = Common & { href: string; target?: string; rel?: string; type?: never }
export type ButtonProps = AsButton | AsAnchor

function variantStyle(variant: ButtonVariant, onDark: boolean): CSSProperties {
  if (variant === 'primary') {
    return onDark
      ? {
          background: 'var(--color-neutral-0)',
          color: 'var(--color-neutral-900)',
          ['--dls-fill' as string]: 'var(--color-neutral-200)',
        }
      : {
          background: 'var(--color-primary)',
          color: 'var(--color-neutral-0)',
          ['--dls-fill' as string]: 'var(--color-primary-dark)',
        }
  }
  if (variant === 'secondary') {
    return {
      background: 'transparent',
      color: onDark ? 'var(--color-neutral-0)' : 'var(--color-primary)',
      border: `var(--border-hairline) solid ${onDark ? 'var(--color-neutral-0)' : 'var(--color-primary)'}`,
      ['--dls-fill' as string]: onDark ? 'var(--color-neutral-0)' : 'var(--color-primary-tint)',
    }
  }
  // tertiary — text button, underline handled by the inner span
  return {
    background: 'transparent',
    color: onDark ? 'var(--color-neutral-0)' : 'var(--color-primary)',
  }
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    onDark = false,
    fullWidth = false,
    iconLeft,
    iconRight,
    forceState,
    children,
  } = props

  const isTertiary = variant === 'tertiary'
  const style: CSSProperties = {
    height: isTertiary ? 'auto' : HEIGHT[size],
    padding: isTertiary ? 0 : `0 ${PAD_X[size]}`,
    gap: 'var(--space-8)',
    borderRadius: isTertiary ? 0 : 'var(--radius-sm)',
    fontSize: 'var(--text-16)',
    fontWeight: 600,
    ...variantStyle(variant, onDark),
    ...(forceState === 'disabled' ? { opacity: 0.5, pointerEvents: 'none' } : null),
    // Showcase-only static states.
    ...(forceState === 'hover' && !isTertiary ? { backgroundSize: '300% 300%' } : null),
    ...(forceState === 'focus'
      ? {
          outline: 'var(--border-thick) solid var(--color-neutral-900)',
          outlineOffset: 'var(--space-2)',
        }
      : null),
  }

  const className = [
    'inline-flex items-center justify-center select-none cursor-pointer',
    'font-sans leading-none no-underline',
    isTertiary ? '' : 'dls-fill',
    fullWidth ? 'w-full' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      {iconLeft}
      {isTertiary ? <span className="dls-underline">{children}</span> : children}
      {iconRight}
    </>
  )

  if ('href' in props && props.href !== undefined) {
    const { href, target, rel } = props
    return (
      <a href={href} target={target} rel={rel} className={className} style={style}>
        {inner}
      </a>
    )
  }
  // Strip the component-only props so they never reach the DOM button.
  const {
    type = 'button',
    disabled,
    variant: _v,
    size: _s,
    onDark: _o,
    fullWidth: _f,
    iconLeft: _il,
    iconRight: _ir,
    forceState: _fs,
    children: _c,
    ...rest
  } = props as AsButton
  void [_v, _s, _o, _f, _il, _ir, _fs, _c]
  return (
    <button
      type={type}
      disabled={disabled ?? forceState === 'disabled'}
      className={className}
      style={style}
      {...rest}
    >
      {inner}
    </button>
  )
}

/* -------------------------------------------------------------- CircleArrow */

/**
 * The one round arrow (PROJECT_CONTEXT §2): circular secondary — transparent,
 * 1px primary ring, primary "→", 8% primary tint fill on hover. Two sizes:
 * S (cards, mega-menu, dashed cards) and XL (large category cards). On photo
 * backgrounds it flips to white ring + dark icon.
 */
export function CircleArrow({
  size = 'S',
  onDark = false,
  forceState,
  label,
}: {
  size?: 'S' | 'XL'
  onDark?: boolean
  forceState?: 'hover'
  label?: string
}) {
  const dim = size === 'XL' ? 'var(--control-h-56)' : 'var(--control-h-40)'
  const icon: IconSize = size === 'XL' ? '24' : '20'
  return (
    <span
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      className="dls-fill inline-flex items-center justify-center rounded-full"
      style={{
        width: dim,
        height: dim,
        color: onDark ? 'var(--color-neutral-0)' : 'var(--color-primary)',
        border: `var(--border-hairline) solid ${onDark ? 'var(--color-neutral-0)' : 'var(--color-primary)'}`,
        ['--dls-fill' as string]: onDark ? 'var(--color-neutral-0)' : 'var(--color-primary-tint)',
        ...(forceState === 'hover' ? { backgroundSize: '300% 300%' } : null),
      }}
    >
      <ArrowRightIcon size={icon} />
    </span>
  )
}
