import { Fragment, type ReactNode } from 'react'

/**
 * Lexical rich-text renderer with the site's tokenised typography (STAGE_3A §2):
 * headings, paragraphs, lists, links, inline marks. Used for the long legal
 * pages (Оферта, Політика). Body size is responsive (14 / 16 / 18) via the
 * wrapping container; headings and lists carry their own token styles.
 *
 * Node typing is intentionally loose — Payload types the richText tree as
 * `{ type: string; [k]: unknown }` children.
 */

type LexNode = { type: string; [key: string]: unknown }
export type LexRoot = { root: { children?: LexNode[]; [key: string]: unknown } } | null | undefined

// Lexical inline format bitmask.
const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4

function text(node: LexNode, key: string): ReactNode {
  const content = String(node.text ?? '')
  const format = typeof node.format === 'number' ? node.format : 0
  let el: ReactNode = content
  if (format & IS_CODE)
    el = (
      <code key={key} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>
        {el}
      </code>
    )
  if (format & IS_BOLD) el = <strong style={{ fontWeight: 600 }}>{el}</strong>
  if (format & IS_ITALIC) el = <em>{el}</em>
  if (format & IS_UNDERLINE) el = <u>{el}</u>
  return <Fragment key={key}>{el}</Fragment>
}

function children(node: LexNode): ReactNode {
  const kids = (node.children as LexNode[] | undefined) ?? []
  return kids.map((kid, i) => renderInline(kid, String(i)))
}

function renderInline(node: LexNode, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return text(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'link': {
      const fields = (node.fields as { url?: string; newTab?: boolean } | undefined) ?? {}
      const url = (node.url as string | undefined) ?? fields.url ?? '#'
      const newTab = fields.newTab
      return (
        <a
          key={key}
          href={url}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
          className="underline underline-offset-2 [text-decoration-color:var(--color-neutral-400)] hover:[text-decoration-color:var(--color-primary)]"
          style={{ color: 'var(--color-primary)' }}
        >
          {children(node)}
        </a>
      )
    }
    default:
      return <Fragment key={key}>{children(node)}</Fragment>
  }
}

function listItems(node: LexNode): ReactNode {
  const kids = (node.children as LexNode[] | undefined) ?? []
  return kids.map((li, i) => (
    <li key={i} style={{ paddingLeft: 'var(--space-4)' }}>
      {children(li)}
    </li>
  ))
}

/** Render one block-level node. */
export function renderBlock(node: LexNode, key: string): ReactNode {
  switch (node.type) {
    case 'heading': {
      const tag = (node.tag as string) || 'h2'
      const base = { margin: 0 }
      if (tag === 'h3')
        return (
          <h3
            key={key}
            className="text-18 font-semibold lg:text-20"
            style={{ ...base, letterSpacing: '-0.01em' }}
          >
            {children(node)}
          </h3>
        )
      return (
        <h2
          key={key}
          className="text-24 font-semibold lg:text-28"
          style={{ ...base, letterSpacing: '-0.02em', textWrap: 'balance' }}
        >
          {children(node)}
        </h2>
      )
    }
    case 'list': {
      const ordered = (node.listType as string) === 'number' || (node.tag as string) === 'ol'
      const Tag = ordered ? 'ol' : 'ul'
      return (
        <Tag
          key={key}
          className="flex flex-col"
          style={{ margin: 0, paddingLeft: 'var(--space-24)', gap: 'var(--space-8)' }}
        >
          {listItems(node)}
        </Tag>
      )
    }
    case 'quote':
      return (
        <blockquote
          key={key}
          style={{
            margin: 0,
            paddingLeft: 'var(--space-16)',
            borderLeft: 'var(--border-thick) solid var(--color-neutral-300)',
            color: 'var(--color-neutral-600)',
          }}
        >
          {children(node)}
        </blockquote>
      )
    case 'paragraph':
    default:
      return (
        <p key={key} style={{ margin: 0, textWrap: 'pretty' }}>
          {children(node)}
        </p>
      )
  }
}

/** Render a flat list of Lexical block nodes with a token column gap. */
export function RichTextNodes({ nodes }: { nodes: LexNode[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-16)' }}>
      {nodes.map((n, i) => renderBlock(n, String(i)))}
    </div>
  )
}

/** Render a whole Lexical document. */
export function RichText({ content }: { content: LexRoot }) {
  const nodes = content?.root?.children ?? []
  return <RichTextNodes nodes={nodes} />
}

/**
 * Split a Lexical document into sections at each H2, for a table of contents.
 * Content before the first H2 becomes an untitled intro section (no ToC entry).
 */
export type LexSection = { id: string; title: string | null; nodes: LexNode[] }

export function splitLexicalSections(content: LexRoot): LexSection[] {
  const nodes = content?.root?.children ?? []
  const sections: LexSection[] = []
  let current: LexSection | null = null
  for (const node of nodes) {
    const isH2 = node.type === 'heading' && ((node.tag as string) || 'h2') === 'h2'
    if (isH2) {
      const title = plainText(node)
      current = { id: `sec-${sections.length + 1}`, title, nodes: [node] }
      sections.push(current)
    } else if (current) {
      current.nodes.push(node)
    } else {
      current = { id: 'sec-intro', title: null, nodes: [node] }
      sections.push(current)
    }
  }
  return sections
}

function plainText(node: LexNode): string {
  if (node.type === 'text') return String(node.text ?? '')
  const kids = (node.children as LexNode[] | undefined) ?? []
  return kids.map(plainText).join('')
}
