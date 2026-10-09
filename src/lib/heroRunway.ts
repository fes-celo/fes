/**
 * Rise-then-cover for every sticky hero (parked-decisions §76).
 *
 * A sticky hero with its copy at the bottom loses that copy first: the next
 * section arrives from the bottom, so the headline is covered within the
 * first few dozen pixels of scroll — exactly while visitors are scrolling to
 * bring it up to eye level. This gives the copy a runway, over one scroll
 * range in two phases:
 *
 *   1. Runway (0 → runway): the copy moves up 1:1 with the scroll, from where
 *      it rests to the middle of the visible screen, while the background
 *      holds still. Reads as ordinary scrolling.
 *   2. Cover (runway → runway + hero height): the copy holds at centre (plus
 *      an optional drift), the next section slides over, an optional dim
 *      layer rises.
 *
 * The runway is a transparent `[data-hero-runway]` element placed right
 * after the hero `<section>`. A sibling, not a wrapper: a sticky element's
 * range is its parent, and a wrapper ending would carry the hero off-screen
 * instead of letting the page cover it. Its height is written here, so it
 * is 0 without JS and under reduced motion — the hero as it was.
 *
 * Markup contract, inside the sticky section:
 *   - `[data-hero-copy]` — the block that rises (required)
 *   - `nav`              — scrolls away 1:1 the whole time (optional)
 *   - `[data-hero-dim]`  — opacity driven by the cover phase (optional)
 *
 * The nav moves by `top`, not a transform: a transform makes it a stacking
 * context and breaks AnimatedLogo's blend (see its docblock). It's a
 * relative box with nothing in flow depending on it, so the per-frame
 * layout is that one small subtree.
 *
 * Driven from scrollY directly rather than a scrubbed timeline, because the
 * phase boundary moves with the viewport and a timeline's segment durations
 * are fixed when it's built. Plain numbers for start/end, not 'top top',
 * because a sticky element's measured position depends on the scroll it was
 * measured at.
 */
import { onPageLoad, onPageUnload } from './lifecycle'
import { gsap, ScrollTrigger } from './sectionMotion'

export interface HeroRunwayOptions {
  /** Opacity of `[data-hero-dim]` at full cover. */
  dimMax?: number
  /** Share of the hero's height the copy keeps drifting up while covered. */
  drift?: number
}

/** The covering section for a hero that may be followed by a runway. */
export function heroCover(hero: HTMLElement): HTMLElement | null {
  let el = hero.nextElementSibling
  while (el?.hasAttribute('data-hero-runway')) el = el.nextElementSibling
  return el as HTMLElement | null
}

export function bindHeroRunway({ dimMax = 0, drift = 0 }: HeroRunwayOptions = {}): void {
  let trigger: ScrollTrigger | null = null
  let measure: (() => void) | null = null
  let reset: (() => void) | null = null

  onPageLoad(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const runwayEl = document.querySelector<HTMLElement>('[data-hero-runway]')
    const section = runwayEl?.previousElementSibling as HTMLElement | null | undefined
    const copy = section?.querySelector<HTMLElement>('[data-hero-copy]')
    if (!runwayEl || !section || !copy) return
    const nav = section.querySelector<HTMLElement>('nav')
    const dim = section.querySelector<HTMLElement>('[data-hero-dim]')

    const setCopyY = gsap.quickSetter(copy, 'y', 'px')
    const setDim = dim ? gsap.quickSetter(dim, 'opacity') : null
    let runway = 0

    // How far the copy travels to be centred in what's actually visible —
    // the section minus --hero-chrome, the strip under a floating mobile
    // toolbar (set on the homepage hero by Hero.astro; 0 elsewhere). offsetTop/offsetHeight
    // ignore transforms, so this measures the copy's resting place even
    // mid-scroll. Floored at the top padding: where the copy is taller than
    // half the view, it stops at the gutter instead of rising past it (the
    // nav has gone by then).
    measure = () => {
      const chrome = parseFloat(getComputedStyle(section).getPropertyValue('--hero-chrome')) || 0
      const visible = section.offsetHeight - chrome
      const floor = parseFloat(getComputedStyle(section).paddingTop) || 0
      const target = Math.max(floor, (visible - copy.offsetHeight) / 2)
      runway = Math.max(0, Math.round(copy.offsetTop - target))
      runwayEl.style.height = runway + 'px'
    }

    const apply = () => {
      const height = section.offsetHeight
      const scroll = Math.min(Math.max(window.scrollY, 0), runway + height)
      const cover = Math.max(0, scroll - runway) / height
      setCopyY(-Math.min(scroll, runway) - cover * height * drift)
      setDim?.(cover * dimMax)
      if (nav) nav.style.top = -scroll + 'px'
    }

    reset = () => {
      runwayEl.style.height = ''
      if (nav) nav.style.top = ''
      gsap.set(copy, { clearProps: 'transform' })
      if (dim) gsap.set(dim, { clearProps: 'opacity' })
    }

    // The runway changes the page's height, so it has to be in place before
    // ScrollTrigger measures anything below it — refreshInit runs first on
    // every refresh (resize, load, fonts). The explicit refresh covers the
    // triggers other scripts already built against the runway-less page.
    measure()
    ScrollTrigger.addEventListener('refreshInit', measure)
    trigger = ScrollTrigger.create({
      start: 0,
      end: () => runway + section.offsetHeight,
      onUpdate: apply,
      onRefresh: apply,
    })
    ScrollTrigger.refresh()
    // The headline's height depends on the display face; a late font swap
    // can rewrap it and move where the copy rests.
    document.fonts?.ready.then(() => trigger && ScrollTrigger.refresh())
  })

  onPageUnload(() => {
    if (measure) ScrollTrigger.removeEventListener('refreshInit', measure)
    trigger?.kill()
    reset?.()
    trigger = measure = reset = null
  })
}
