/**
 * Speculation Rules API surface that TypeScript's DOM lib doesn't ship yet.
 *
 * BaseLayout emits `<script type="speculationrules">` to prerender the link
 * a visitor is reaching for, and motion.ts has to tell a prerendered
 * document apart from a backgrounded one — both report
 * `visibilityState: 'hidden'`, but only the prerender is about to become
 * the page someone is looking at (see `whenActivated`).
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/prerendering
 */
interface Document {
  /** True while this document is a speculative prerender, false once activated. */
  readonly prerendering: boolean
}

interface DocumentEventMap {
  /** Fires on the prerendered document at the moment it is activated. */
  prerenderingchange: Event
}
