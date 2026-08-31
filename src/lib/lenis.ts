/**
 * Site-wide smooth scroll. Synced to GSAP's own ticker rather than Lenis'
 * `autoRaf`, so Lenis and every ScrollTrigger-driven pin on the site share
 * ONE clock — two independently-scheduled rAF loops racing each other is
 * what produces the classic "smooth scroll fights the pin" jitter. Nothing
 * here touches a ScrollTrigger's own start/end math; it only smooths the
 * scroll VALUE those triggers read (via `lenis.on('scroll', ScrollTrigger.update)`
 * below), which is GSAP's own documented integration for the two libraries.
 *
 * Astro-lifecycle bound like every other scroll-driven piece on this site
 * (see sectionMotion.ts): init on astro:page-load, teardown on
 * astro:before-swap, so a client-side navigation can't stack a second Lenis
 * instance — or a second gsap.ticker callback — on top of the first.
 *
 * No manual prefers-reduced-motion branch: Lenis' own `respectReducedMotion`
 * (on by default) already forces its lerp to 1 — scroll tracks the input
 * device 1:1, no smoothing — and makes `scrollTo()` calls instant under that
 * preference, which is the same outcome this site's other motion already
 * lands on by hand.
 */
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './sectionMotion'

let lenis: Lenis | null = null

function raf(time: number) {
  lenis?.raf(time * 1000)
}

function setup() {
  lenis = new Lenis()
  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add(raf)
  // Lenis already smooths the scroll delta itself; GSAP's lag-smoothing
  // (which skips/slows the ticker to "catch up" after a stall) would fight
  // that by making the shared clock itself jump, so it's disabled wholesale
  // rather than just for this one ticker callback.
  gsap.ticker.lagSmoothing(0)
}

function teardown() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
}

document.addEventListener('astro:page-load', setup)
document.addEventListener('astro:before-swap', teardown)

/** For anything that needs to scroll programmatically (e.g. "back to top") — falls back to nothing if Lenis hasn't initialized yet. */
export function getLenis(): Lenis | null {
  return lenis
}
