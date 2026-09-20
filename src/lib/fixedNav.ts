/**
 * Fixed Menu trigger, pinned over the page instead of living in
 * BaseLayout's bordered header — the hideHeader pattern documented there.
 * Piloted on the homepage first; see FixedNav.astro for the component (and
 * for why the logo isn't part of this — it stays in Hero.astro's own in-flow
 * nav on purpose) and docs/parked-decisions.md for why this replaced the
 * sitewide blend-mode / frosted-chip options that were also prototyped.
 *
 * Two independent mechanisms:
 *
 * - Declared ink. Each section states whether the nav should read light or
 *   dark ink over it via `data-nav-ink="light"|"dark"` (light ink = white,
 *   for a dark section; dark = near-black, for a light one) — not computed
 *   from the pixels, unlike a `mix-blend-mode: difference` approach, which
 *   measured muddy over both photography and the brand's saturated purple
 *   in the prototype this replaced. A thin PROBE line at the nav's own
 *   vertical centre, not a band as tall as the nav, picks up whichever
 *   section is actually behind it — a taller band double-fires while the
 *   nav straddles a section boundary, which was a real bug caught on the
 *   nav-experiments prototype (the last section to fire its callback won,
 *   independent of which one the nav was actually sitting over).
 *
 * - Auto-hide. Hides past a downward-scroll threshold, reveals on a small
 *   upward one — the two are asymmetric on purpose (see the constants).
 *
 * setNavInk() is exported for sections with dynamic content, like the
 * homepage's own invert-zone: the generic observer only fires on boundary
 * CROSSINGS, so it can't see a value changing while the nav is already
 * parked inside one long intersecting section. The zone's own ScrollTrigger
 * calls setNavInk() directly, at the exact moment it flips its own
 * background, instead of the nav discovering it late (or not at all).
 */
export type NavInk = 'light' | 'dark'

let navEl: HTMLElement | null = null

/** Safe to call before setup, after teardown, or on a page with no fixed nav — a no-op rather than a throw, since callers like the invert-zone script don't otherwise know whether this component is even on the page. */
export function setNavInk(ink: NavInk) {
  navEl?.style.setProperty('--dark-progress', ink === 'light' ? '1' : '0')
}

const SHOW_NEAR_TOP = 80
const HIDE_AFTER = 10
const REVEAL_AFTER = 7

export function setupFixedNav() {
  const nav = document.getElementById('fixed-nav')
  const trigger = document.getElementById('fixed-nav-trigger')
  if (!nav || !trigger) return null
  navEl = nav

  // ---------- Declared ink ----------
  let observer: IntersectionObserver | null = null

  function setupInkObserver() {
    const sections = document.querySelectorAll<HTMLElement>('[data-nav-ink]')
    if (sections.length === 0) return

    const r = trigger!.getBoundingClientRect()
    const probe = Math.round((r.top + r.bottom) / 2) || 34

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const ink: NavInk = (entry.target as HTMLElement).dataset.navInk === 'dark' ? 'dark' : 'light'
          setNavInk(ink)
        }
      },
      {
        rootMargin: `-${probe}px 0px -${Math.max(0, window.innerHeight - probe - 1)}px 0px`,
        threshold: 0,
      },
    )
    sections.forEach((s) => observer!.observe(s))
  }

  setupInkObserver()

  // Viewport width changes the trigger's fluid height (it's set from
  // --nav-logo-h, a clamp() — kept in sync with the logo's own height even
  // though the logo itself lives in Hero.astro now), which moves the probe
  // line — recomputed the same way Hero.astro's own resize handler
  // re-derives its other viewport-dependent values.
  let resizeFrame = 0
  function onResize() {
    if (resizeFrame) return
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0
      observer?.disconnect()
      setupInkObserver()
    })
  }
  window.addEventListener('resize', onResize)

  // ---------- Auto-hide ----------
  let hidden = false
  let lastY = window.scrollY
  let downAccum = 0
  let upAccum = 0

  function setHidden(next: boolean) {
    if (next === hidden) return
    hidden = next
    nav!.dataset.hidden = String(next)
  }

  function onScroll() {
    // Clamped so iOS rubber-band overscroll past the bottom doesn't read as
    // a genuine upward delta and pop the nav open for no reason.
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const y = Math.min(Math.max(0, window.scrollY), max)
    const delta = y - lastY
    lastY = y

    // Never hidden while the mobile menu panel is open (its trigger's own
    // aria-expanded, toggled by MobileMenu.astro — reused rather than a
    // second piece of open/closed state), or near the top of the page,
    // where there's nothing to get out of the way of yet.
    const menuOpen = trigger!.getAttribute('aria-expanded') === 'true'
    if (menuOpen || y <= SHOW_NEAR_TOP) {
      downAccum = 0
      upAccum = 0
      setHidden(false)
      return
    }

    if (delta > 0) {
      upAccum = 0
      downAccum += delta
      if (downAccum > HIDE_AFTER) setHidden(true)
    } else if (delta < 0) {
      downAccum = 0
      upAccum -= delta
      if (upAccum > REVEAL_AFTER) setHidden(false)
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  return () => {
    observer?.disconnect()
    if (resizeFrame) cancelAnimationFrame(resizeFrame)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', onScroll)
    navEl = null
  }
}
