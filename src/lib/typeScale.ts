/**
 * The type scale, described once in JS so the styleguide page and the dev
 * type inspector both name the steps exactly as `global.css` defines them.
 *
 * This file is METADATA ONLY — the sizes themselves live in the `@theme`
 * block in `src/styles/global.css` and nowhere else. If a step's anchors
 * change there, update `anchors` here to match; nothing here feeds the CSS.
 */
export interface TypeStep {
  /** Token name without the `text-` prefix — `h3`, `body-sm`, `18`. */
  token: string
  /** The Tailwind utility class that applies it. */
  className: string
  /** Mobile (375px) → desktop (1920px) anchors, in px. */
  anchors: string
  /** What the step is for, in one line. */
  role: string
}

export const typeScale: TypeStep[] = [
  { token: 'display',   className: 'text-display',   anchors: '44 → 88',     role: 'Hero headline. One per page, at most.' },
  { token: 'h1',        className: 'text-h1',        anchors: '34 → 56',     role: 'Page/section headline and the big pull-quotes.' },
  { token: 'h2',        className: 'text-h2',        anchors: '27 → 38',     role: 'Section headline inside a page.' },
  { token: 'h3',        className: 'text-h3',        anchors: '22 → 26',     role: 'Card titles, sub-section headings.' },
  { token: 'h4',        className: 'text-h4',        anchors: '17.5 → 19',   role: 'Smallest heading — list/row labels.' },
  { token: 'lead',      className: 'text-lead',      anchors: '19 → 20',     role: 'DECK: the 1–3 line paragraph under a heading. Not long prose.' },
  { token: 'body',      className: 'text-body',      anchors: '16 → 18',     role: 'Long-form running copy. Also the Selected Projects row-2 card copy. Leading 1.2.' },
  { token: 'body-sm',   className: 'text-body-sm',   anchors: '14 → 15',     role: 'Secondary copy, captions, fine print. Leading 1.2.' },
  { token: 'nav',       className: 'text-nav',       anchors: '20 (fixed)',  role: 'Desktop nav links. Deliberately not fluid.' },
  { token: 'separator', className: 'text-separator', anchors: '24 → 32',     role: 'One-off: the “·” between ProjectsFilter categories.' },
  { token: 'meta',      className: 'text-meta',      anchors: '12.5 → 13',   role: 'Metadata rows — dates, counters, tags.' },
  { token: 'eyebrow',   className: 'text-eyebrow',   anchors: '12 → 12.5',   role: 'Uppercase label above a heading.' },
]

/** Longest-first so `text-body-sm` never matches the `text-body` pattern. */
export const tokensBySpecificity = [...typeScale]
  .map((s) => s.token)
  .sort((a, b) => b.length - a.length)
