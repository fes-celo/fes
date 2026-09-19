/**
 * Lifecycle plumbing for the Systems pages' scroll-driven sections.
 *
 * Every section on those pages follows the same three rules, and getting any
 * one of them wrong is invisible until a client-side navigation:
 *
 * 1. Init on `astro:page-load`, tear down on `astro:before-swap` (see
 *    docs/conventions.md). `astro:page-load` fires on EVERY navigation, so a
 *    setup without a matching teardown stacks another copy of every trigger.
 * 2. Everything runs inside a `gsap.context()` scoped to the section's own
 *    root element, so `ctx.revert()` can reclaim it wholesale rather than
 *    each section hand-rolling a cleanup list it will eventually forget to
 *    update.
 * 3. Pinned/3D effects are gated behind `gsap.matchMedia()`. The Systems
 *    pages pin more sections than the rest of the site combined, and a
 *    leaked pin leaves the page permanently scroll-locked — the single most
 *    visible failure mode available here.
 *
 * Sections call `bindSection()` from their own component `<script>` rather
 * than being wired up by the page. That's what makes the components genuinely
 * drop-in: SystemExpertiseRotator works the same on Growth Communication and
 * Creative Projects Blueprint without either page importing anything.
 */
import { onPageLoad, onPageUnload } from './lifecycle'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

// Dev-only handle for the check this page's teardown exists to pass:
// `__ST.getAll().length` after navigating away should be whatever the
// destination page legitimately creates, never this page's triggers on top
// of it. Stripped from production builds by the import.meta.env.DEV guard.
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __ST?: typeof ScrollTrigger }).__ST = ScrollTrigger
}

/**
 * The full-choreography branch: pinning, scroll-jacking and 3D transforms.
 *
 * 1024px is the site's existing `lg` breakpoint, not a new number — below it
 * the layout is single-column and a pinned section costs a viewport of
 * scroll to show one word. Mobile and reduced-motion therefore share ONE
 * fallback branch rather than each growing their own.
 */
export const MOTION_FULL = '(prefers-reduced-motion: no-preference) and (min-width: 1024px)'

/** Everything else: narrow viewports OR a reduced-motion preference. */
export const MOTION_FALLBACK = '(prefers-reduced-motion: reduce), (max-width: 1023.98px)'

type MatchMedia = ReturnType<typeof gsap.matchMedia>

/**
 * ONE debounced `ScrollTrigger.refresh()` shared by every section that wants
 * one, instead of a private resize listener per component.
 *
 * ScrollTrigger already re-measures on resize by itself, and
 * `invalidateOnRefresh` re-runs function-based `end` values with it — these
 * calls are the belt-and-braces pass that guarantees a section's own measured
 * geometry can never go stale. But `refresh()` re-measures EVERY trigger on
 * the page, and the Systems pages run three pinned sections at once: three
 * components each holding their own listener meant three full page-wide
 * refreshes per resize settle, each one re-running every other section's pin
 * math. The timer here is module-level, so any number of subscribers collapse
 * into a single refresh.
 *
 * Returns its own unsubscribe. The last subscriber to leave drops the
 * listener and cancels a pending refresh, so a teardown mid-resize can't fire
 * one against a swapped-out DOM.
 */
let refreshSubscribers = 0
let refreshTimer = 0

function onViewportResize() {
  clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
}

export function shareResizeRefresh(): () => void {
  if (refreshSubscribers === 0) window.addEventListener('resize', onViewportResize)
  refreshSubscribers++

  let released = false
  return () => {
    if (released) return
    released = true
    refreshSubscribers--
    if (refreshSubscribers === 0) {
      window.removeEventListener('resize', onViewportResize)
      clearTimeout(refreshTimer)
    }
  }
}

export interface SectionContext {
  /** The section's root element — the `gsap.context()` scope. */
  root: HTMLElement
  /** Register the two branches against MOTION_FULL / MOTION_FALLBACK. */
  mm: MatchMedia
}

/**
 * Wires `selector` to the Astro lifecycle. `init` runs once per matching
 * element, inside that element's own context.
 *
 * Safe to call at module scope: component `<script>` tags are bundled once
 * per page regardless of how many instances the page renders, and a page
 * with no matching element simply never calls `init`.
 */
export function bindSection(selector: string, init: (ctx: SectionContext) => void): void {
  let instances: Array<{ ctx: gsap.Context; mm: MatchMedia }> = []

  function setup() {
    document.querySelectorAll<HTMLElement>(selector).forEach((root) => {
      const mm = gsap.matchMedia()
      const ctx = gsap.context(() => init({ root, mm }), root)
      instances.push({ ctx, mm })
    })
  }

  function teardown() {
    instances.forEach(({ ctx, mm }) => {
      // Both, deliberately. `mm.kill()` reverts the media-query branches and
      // the ScrollTriggers created inside them; `ctx.revert()` catches
      // anything set up outside a branch and restores inline styles. Either
      // alone has left a trigger behind in testing.
      mm.kill()
      ctx.revert()
    })
    instances = []
  }

  onPageLoad(setup)
  onPageUnload(teardown)
}
