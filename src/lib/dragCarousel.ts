/**
 * Click-and-drag (with inertia + magnetic snap-to-nearest-card) for a native
 * `overflow-x: auto` card row.
 *
 * Used by the homepage Testimonials, Careers "Feedback from previous team
 * members", the Agency team row, and the Systems "Sound familiar?" row's own
 * mobile/reduced-motion fallback branch — tracks that were otherwise
 * hand-rolling a near identical `mousedown/mousemove` → `scrollLeft`
 * listener.
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
 *
 * LAZY. Draggable + InertiaPlugin are ~40KB and were the single longest
 * task on every page that has a drag row (600–850ms on a throttled phone,
 * measured), for an interaction that only exists once the row is on screen
 * and the pointer is on it. So the plugins are `import()`ed the first time
 * the track comes within LOAD_MARGIN of the viewport, and attached then.
 * Until that moment the row is a plain native scroller — same resting
 * layout, same scroll-snap, same prev/next buttons — so nothing the user
 * can see is different; only the grab-and-throw arrives a beat later.
 * Attaching doesn't change that either: the native scroll-snap is only
 * suspended while a drag is actually in progress (see `attach` below).
 *
 * The return value is still a synchronous cleanup: it cancels a pending
 * load and kills the Draggable if it was already attached.
 */
import { gsap } from 'gsap'
import type { Draggable as DraggableType } from 'gsap/Draggable'
import { pressCards } from './pressCards'

export { pressCards, PRESS_SCALE, PRESS_DURATION, PRESS_EASE } from './pressCards'

/** How close to the viewport the track has to be before the plugins load. */
const LOAD_MARGIN = '400px 0px'

/**
 * Throw physics, shared so all the rows settle with the same weight.
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

let pluginsPromise: Promise<typeof DraggableType> | null = null

/** One import per page, however many tracks ask for it. */
function loadDraggable(): Promise<typeof DraggableType> {
  pluginsPromise ??= Promise.all([import('gsap/Draggable'), import('gsap/InertiaPlugin')]).then(
    ([{ Draggable }, { InertiaPlugin }]) => {
      gsap.registerPlugin(Draggable, InertiaPlugin)
      return Draggable
    },
  )
  return pluginsPromise
}

function attach(Draggable: typeof DraggableType, track: HTMLElement, opts: { cardSelector: string }): () => void {
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

  // Both native CSS properties below are suspended FOR THE DURATION OF A
  // DRAG ONLY, not for the lifetime of the Draggable.
  //
  // They used to be switched off at attach time and back on at cleanup,
  // which quietly cost every one of these rows its native scroll-snap for
  // good: the moment the row came within LOAD_MARGIN, `scroll-snap-type`
  // went to `none` and never came back, so a wheel/trackpad scroll — the
  // way most people actually move these rows on desktop — left the cards
  // resting wherever the scroll happened to stop. Scoping the suspension
  // to the gesture gives the row GSAP's magnetic snap while dragging and
  // the browser's own snap the rest of the time; the two agree on where a
  // card rests (`nearestCardX` measures offsets relative to the first
  // card, which is exactly what `snap-center` + the track's leading
  // padding, or `snap-align: start` + `scroll-padding`, resolve to), so
  // handing control back at the end of a throw never moves the row.
  //
  // WHY they have to be off during the drag at all:
  //
  // - `scroll-snap-type`: JS owns the resting position via `snap` below,
  //   and leaving native snap on lets the browser fight the inertia glide
  //   the same way sectionMotion.ts's pinned branch already has to.
  //
  // - `scroll-behavior`: THE thing that made dragging feel clunky. These
  //   tracks carry Tailwind's `scroll-smooth` for the prev/next buttons,
  //   and `scroll-behavior: smooth` applies to plain `scrollLeft`
  //   assignment too — so every frame of a drag started a fresh
  //   browser-run scroll ANIMATION toward that frame's value instead of
  //   going there, and the row chased the cursor from several hundred
  //   milliseconds behind (measured: assigning 500 settled at 286). The
  //   buttons are unaffected either way: their `scrollBy` passes
  //   `behavior: 'smooth'` explicitly, which outranks the CSS property.
  let suspended = false
  let prevSnapType = ''
  let prevScrollBehavior = ''

  function suspendNativeScroll() {
    if (suspended) return
    suspended = true
    prevSnapType = track.style.scrollSnapType
    prevScrollBehavior = track.style.scrollBehavior
    track.style.scrollSnapType = 'none'
    track.style.scrollBehavior = 'auto'
  }

  function restoreNativeScroll() {
    if (!suspended) return
    suspended = false
    track.style.scrollSnapType = prevSnapType
    track.style.scrollBehavior = prevScrollBehavior
  }

  const [draggable] = Draggable.create(proxy, {
    ...DRAG_PHYSICS,
    type: 'x',
    trigger: track,
    allowNativeTouchScrolling: true,
    bounds: { minX: -maxScroll(), maxX: 0 },
    onPressInit(this: DraggableType) {
      // Re-baseline the proxy to the CURRENT scroll position before this
      // drag's own math takes over — without this, a resize or a
      // prev/next-button click between drags would leave proxy.x stale, and
      // the next drag would jump the row on its first pixel of movement.
      gsap.set(proxy, { x: -track.scrollLeft })
      this.applyBounds({ minX: -maxScroll(), maxX: 0 })
      pressCards(cards, true)
    },
    // Suspended on DRAG start rather than on press: a press that never
    // moves (a click, or a touch the user turns into a vertical page
    // scroll — `allowNativeTouchScrolling` hands those straight back to
    // the browser) should leave native snapping exactly as it found it.
    onDragStart: suspendNativeScroll,
    onDrag(this: DraggableType) {
      track.scrollLeft = -this.x
    },
    onThrowUpdate(this: DraggableType) {
      track.scrollLeft = -this.x
    },
    snap: (value: number) => nearestCardX(value),
    // The throw tween is what lands the row on `snap`'s target, so native
    // snap only comes back once it has finished. `inertia: true` means a
    // release after any real drag always produces one, however slow —
    // but a press with no movement resolves through `onRelease` alone,
    // hence the one-frame check for a throw that never started.
    onThrowComplete: restoreNativeScroll,
    onRelease: () => {
      pressCards(cards, false)
      requestAnimationFrame(() => {
        if (!draggable?.isThrowing) restoreNativeScroll()
      })
    },
  })

  return () => {
    draggable?.kill()
    proxy.remove()
    restoreNativeScroll()
    gsap.set(cards, { clearProps: 'scale' })
  }
}

export function createDragCarousel(track: HTMLElement, opts: { cardSelector: string }): (() => void) | null {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  let cancelled = false
  let detach: (() => void) | null = null

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      void loadDraggable().then((Draggable) => {
        // The page may have torn this row down while the plugins were in
        // flight — attaching to a detached track would just leak a Draggable.
        if (cancelled || !track.isConnected) return
        detach = attach(Draggable, track, opts)
      })
    },
    { rootMargin: LOAD_MARGIN },
  )
  observer.observe(track)

  return () => {
    cancelled = true
    observer.disconnect()
    detach?.()
    detach = null
  }
}
