/**
 * Measurement for StickyHero (parked-decisions §76, §79). The rise itself is
 * CSS — the copy is `position: sticky` — so nothing here runs per scroll
 * frame. This only answers the two questions CSS can't, because both depend
 * on the copy's rendered height:
 *
 *   --hero-copy-top  where the copy stops: centred in what's actually
 *                    visible (the hero minus --hero-chrome, the strip under
 *                    a floating mobile toolbar), floored at the gutter for a
 *                    copy block taller than half the screen.
 *   --hero-runway    how far it travels to get there from its resting place
 *                    at the bottom of the hero — which is also how long the
 *                    next section waits before it starts covering.
 *
 * Both are written on every ScrollTrigger refresh (load, resize, fonts),
 * inside `refreshInit` so they're in place before any trigger below measures
 * the page. Reduced motion doesn't skip this: the rise is ordinary scrolling,
 * not animation.
 *
 * The homepage's dim layer and drift (StickyHero's dimMax / drift) are the
 * only scroll-linked JS left, and only during the cover: opacity and a small
 * transform, both composited, and both skipped under reduced motion.
 */
import { onPageLoad, onPageUnload } from './lifecycle'
import { gsap, ScrollTrigger } from './sectionMotion'

/** The covering section for a sticky hero. */
export function heroCover(hero: HTMLElement): HTMLElement | null {
  const section = hero.closest<HTMLElement>('[data-sticky-hero]') ?? hero
  return section.nextElementSibling as HTMLElement | null
}

export function bindStickyHero(): void {
  let measure: (() => void) | null = null
  let cover: gsap.core.Timeline | null = null

  onPageLoad(() => {
    const section = document.querySelector<HTMLElement>('[data-sticky-hero]')
    const bg = section?.querySelector<HTMLElement>('[data-hero-bg]')
    const nav = section?.querySelector<HTMLElement>('[data-hero-nav]')
    const copy = section?.querySelector<HTMLElement>('[data-hero-copy]')
    if (!section || !bg || !nav || !copy) return

    let runway = 0

    measure = () => {
      const height = bg.offsetHeight
      const chrome = parseFloat(getComputedStyle(section).getPropertyValue('--hero-chrome')) || 0
      const floor = parseFloat(getComputedStyle(nav).paddingTop) || 0
      // The resting top is derived, not read: a sticky element's offsetTop
      // includes however far it is currently stuck.
      const rest = height - (parseFloat(getComputedStyle(copy).marginBottom) || 0) - copy.offsetHeight
      const stop = Math.round(Math.max(floor, (height - chrome - copy.offsetHeight) / 2))
      runway = Math.max(0, Math.round(rest - stop))
      section.style.setProperty('--hero-copy-top', stop + 'px')
      section.style.setProperty('--hero-runway', runway + 'px')
    }

    measure()
    ScrollTrigger.addEventListener('refreshInit', measure)

    const dimMax = Number(section.dataset.dimMax) || 0
    const drift = Number(section.dataset.drift) || 0
    const dim = section.querySelector<HTMLElement>('[data-hero-overlay]')
    if ((dim || drift) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cover = gsap.timeline({
        scrollTrigger: {
          start: () => runway,
          end: () => runway + bg.offsetHeight,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      if (dim) cover.to(dim, { opacity: dimMax, ease: 'none' }, 0)
      if (drift) cover.to(copy, { y: () => -bg.offsetHeight * drift, ease: 'none' }, 0)
    }

    // The runway changes the page's height; refresh the triggers other
    // scripts already built against the page without it.
    ScrollTrigger.refresh()
    // The headline's height depends on the display face; a late font swap
    // can rewrap it and move where the copy rests.
    document.fonts?.ready.then(() => measure && ScrollTrigger.refresh())
  })

  onPageUnload(() => {
    if (measure) ScrollTrigger.removeEventListener('refreshInit', measure)
    cover?.scrollTrigger?.kill()
    cover?.revert()
    cover = measure = null
  })
}
