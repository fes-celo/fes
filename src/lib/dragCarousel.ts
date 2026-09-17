/**
 * Click-and-drag (with inertia + magnetic snap-to-nearest-card) for a native
 * `overflow-x: auto` card row.
 *
 * Used by the homepage Testimonials, Careers "Feedback from previous team
 * members", and the Systems "Sound familiar?" row's own mobile/reduced-motion
 * fallback branch — three tracks that were otherwise hand-rolling a near
 * identical `mousedown/mousemove` → `scrollLeft` listener.
 *
 * NOT `Draggable`'s `type: 'scroll'`: that mode wraps the target's children
 * in a GSAP-generated "ScrollProxy" content div to simulate overscroll, and
 * that wrapper defaults to `display: block` — it silently breaks a
 * `display: flex` track's row layout (every card collapses into a stacked
 * column). Instead, same as the pinned branch of `SystemProblemCards.astro`
 * and `horizontalLoop.ts`: a detached proxy (never inserted in the DOM) is
 * the actual `type: 'x'` drag target, and `scrollLeft` is written by hand
 * from its `x` — one extra line, but the track's own markup and layout are
 * never touched.
 */
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

gsap.registerPlugin(Draggable, InertiaPlugin)

/** Subtle press feedback: each card shrinks toward its own center, so the
 *  gap between cards visibly grows rather than the row scaling as one block. */
export const PRESS_SCALE = 0.98
export const PRESS_DURATION = 0.2
export const PRESS_EASE = 'power2.out'

/**
 * Throw physics, shared so all three rows settle with the same weight.
 *
 * `edgeResistance: 1` pins the drag exactly at the bounds instead of letting
 * it creep past them: the row is clamped by `scrollLeft` (or by the pin's own
 * range) either way, so any movement past the end is invisible travel the
 * user then has to drag back through before the row responds — a dead zone
 * that reads as lag.
 *
 * `overshootTolerance: 0` lands straight on the snapped card rather than
 * sailing past and springing back (same reasoning as horizontalLoop.ts).
 *
 * The duration cap is the "magnetic" part: GSAP derives the throw length from
 * release velocity, and its default 2s ceiling makes a fast flick drift for
 * what feels like forever before it settles.
 */
export const DRAG_PHYSICS = {
  inertia: true,
  edgeResistance: 1,
  overshootTolerance: 0,
  minDuration: 0.3,
  maxDuration: 0.85,
} as const

export function pressCards(cards: Element[], pressed: boolean) {
  gsap.to(cards, { scale: pressed ? PRESS_SCALE : 1, duration: PRESS_DURATION, ease: PRESS_EASE, overwrite: 'auto' })
}

export function createDragCarousel(track: HTMLElement, opts: { cardSelector: string }): (() => void) | null {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const cards = Array.from(track.querySelectorAll<HTMLElement>(opts.cardSelector))
  const proxy = document.createElement('div')

  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth)

  // Nearest card's scrollLeft, measured fresh on every call (both here and
  // in onPressInit below) so a resize between drags can never leave this or
  // the bounds stale — no separate resize listener needed.
  //
  // Offsets are taken RELATIVE TO THE FIRST CARD, not as raw offsetLeft: at
  // `scrollLeft: 0` card 1 already sits in its intended slot, inset by the
  // track's own leading padding (the homepage and careers rows'
  // `lg:px-[calc(50vw-22.5rem)]`, the Systems row's gutter). Snapping to a
  // raw offsetLeft would land every card that far short of that slot — half
  // a card out on desktop. Nothing here is keyed to those values: every
  // offset is measured off the DOM, which is why the viewport-zoom pass (see
  // global.css) could change them without touching this file.
  function nearestCardX(proxyX: number) {
    if (cards.length === 0) return proxyX
    const first = cards[0]!.offsetLeft
    const limit = maxScroll()
    const target = -proxyX
    let closest = 0
    let closestDist = Infinity
    for (const card of cards) {
      // Clamped BEFORE comparing, not after: the cards past the end of the
      // scrollable range all collapse onto that end, and when the user
      // releases near it THAT is the position they're closest to. Picking
      // the nearest raw offset first and clamping the winner would instead
      // drag them back to the last card that fully fits.
      const offset = gsap.utils.clamp(0, limit, card.offsetLeft - first)
      const dist = Math.abs(offset - target)
      if (dist < closestDist) {
        closest = offset
        closestDist = dist
      }
    }
    return -closest
  }

  // JS now owns the resting position via `snap` below — leaving native
  // scroll-snap on would let the browser fight the inertia glide the same
  // way sectionMotion.ts's pinned branch already has to switch it off.
  const prevSnapType = track.style.scrollSnapType
  track.style.scrollSnapType = 'none'

  // THE thing that made dragging feel clunky: these tracks carry Tailwind's
  // `scroll-smooth` for the prev/next buttons, and `scroll-behavior: smooth`
  // applies to plain `scrollLeft` assignment too — so every frame of a drag
  // started a fresh browser-run scroll ANIMATION toward that frame's value
  // instead of going there, and the row chased the cursor from several
  // hundred milliseconds behind (measured: assigning 500 settled at 286).
  // The buttons are unaffected: their `scrollBy` passes `behavior: 'smooth'`
  // explicitly, which outranks the CSS property.
  const prevScrollBehavior = track.style.scrollBehavior
  track.style.scrollBehavior = 'auto'

  const [draggable] = Draggable.create(proxy, {
    ...DRAG_PHYSICS,
    type: 'x',
    trigger: track,
    allowNativeTouchScrolling: true,
    bounds: { minX: -maxScroll(), maxX: 0 },
    onPressInit(this: Draggable) {
      // Re-baseline the proxy to the CURRENT scroll position before this
      // drag's own math takes over — without this, a resize or a
      // prev/next-button click between drags would leave proxy.x stale, and
      // the next drag would jump the row on its first pixel of movement.
      gsap.set(proxy, { x: -track.scrollLeft })
      this.applyBounds({ minX: -maxScroll(), maxX: 0 })
      pressCards(cards, true)
    },
    onDrag(this: Draggable) {
      track.scrollLeft = -this.x
    },
    onThrowUpdate(this: Draggable) {
      track.scrollLeft = -this.x
    },
    snap: (value: number) => nearestCardX(value),
    onRelease: () => pressCards(cards, false),
  })

  return () => {
    draggable?.kill()
    proxy.remove()
    track.style.scrollSnapType = prevSnapType
    track.style.scrollBehavior = prevScrollBehavior
    gsap.set(cards, { clearProps: 'scale' })
  }
}
