import type { Locale } from '@/i18n/config'
import type { Page } from '@/payload-types'

import { AboutHero } from './AboutHero'
import { CtaText } from './CtaText'
import { FaqBlock } from './FaqBlock'
import { PartPath } from './PartPath'
import { ReviewsBlock } from './ReviewsBlock'
import { StatsBlock } from './StatsBlock'
import { TeamBlock } from './TeamBlock'
import { WhatElseWeDo } from './WhatElseWeDo'

/**
 * Renders a page's block layout (DEV_CONTEXT §3). One component per block type;
 * an empty block renders nothing. Real block components land per page across
 * stage 3 — a block type without a component yet renders a small labelled
 * placeholder (dev only), never a hard error. The map is order-agnostic: block
 * order comes from the CMS layout array (drag-and-drop in Payload).
 */

export type PageBlock = NonNullable<Page['layout']>[number]
export type BlockComponentProps<T extends PageBlock['blockType']> = Extract<
  PageBlock,
  { blockType: T }
> & { locale: Locale }

// Registry of implemented blocks, extended as each page is built. Components may
// be async server components (e.g. reviews fetch their data).
type BlockComponent<K extends PageBlock['blockType']> = (
  props: BlockComponentProps<K>,
) => React.ReactNode | Promise<React.ReactNode>
type Registry = { [K in PageBlock['blockType']]?: BlockComponent<K> }

const REGISTRY: Registry = {
  aboutHero: AboutHero,
  stats: StatsBlock,
  partPath: PartPath,
  team: TeamBlock,
  whatElseWeDo: WhatElseWeDo,
  reviewsBlock: ReviewsBlock,
  ctaText: CtaText,
  faq: FaqBlock,
}

export function BlockRenderer({ blocks, locale }: { blocks: Page['layout']; locale: Locale }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block) => {
        const Component = REGISTRY[block.blockType] as
          | ((props: PageBlock & { locale: Locale }) => React.ReactNode | Promise<React.ReactNode>)
          | undefined
        const key = block.id ?? block.blockType
        if (Component) return <Component key={key} {...block} locale={locale} />
        return <BlockPlaceholder key={key} type={block.blockType} />
      })}
    </>
  )
}

/** Visible-but-quiet placeholder for a block type that has no component yet. */
function BlockPlaceholder({ type }: { type: string }) {
  if (process.env.NODE_ENV === 'production') return null
  return (
    <div
      aria-hidden="true"
      style={{
        margin: 'var(--space-16)',
        padding: 'var(--space-16)',
        border: 'var(--border-hairline) dashed var(--color-neutral-300)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-neutral-500)',
        fontSize: 'var(--text-13)',
      }}
    >
      block: {type}
    </div>
  )
}
