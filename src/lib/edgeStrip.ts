/**
 * Bottom edge strip: a thin `position: fixed` block at the foot of the
 * viewport, painted the colour of whatever section is behind it, so iOS 26
 * Safari tints its floating toolbar to match the page instead of showing a
 * light strip under a dark section (parked-decisions §81, which also covers
 * why the top edge and theme-color are left alone). Opt-in per page through
 * BaseLayout's `edgeStrip` prop; the homepage is the pilot.
 *
 * Which colour, in order:
 *
 * 1. `data-edge-color` on the nearest `[data-nav-ink]` zone. For zones whose
 *    background is an image, a gradient or a shader — nothing a computed
 *    style can report — so the zone declares the solid colour its bottom
 *    edge reads as (the homepage hero does).
 * 2. The first opaque `background-color` from the nearest `section`,
 *    `footer` or zone at the probe outwards, stopping short of `<main>`. Never from the element at the probe itself, so a card or an
 *    image scrolling past doesn't flick the toolbar to its own colour (the
 *    homepage's What we do cards did, in the first pass). This is what
 *    follows the invert-zone through its flip: it is unmarked and changes
 *    colour without crossing anything, so the strip resolves on every scroll
 *    frame rather than on IO crossings the way FixedNav does.
 * 3. The zone's declared ink: light ink means a dark section (neutral-950),
 *    dark ink, or no zone at all, the page canvas. `<main>` is excluded from
 *    step 2 so that this step is reachable: main is always opaque canvas.
 *
 * The probe line sits just above the strip. The strip itself is
 * `pointer-events: none`, so hit-testing never finds it.
 */

const PROBE_ABOVE = 2

export function setupEdgeStrip() {
  const strip = document.getElementById('edge-strip')
  if (!strip) return null

  const root = document.documentElement
  let frame = 0
  let current = ''

  function opaqueBackground(from: Element | null) {
    for (let el = from; el && el.tagName !== 'MAIN' && el !== document.body; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor
      if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg) && !/\/\s*0\)$/.test(bg)) return bg
    }
    return null
  }

  function resolve() {
    frame = 0
    const y = window.innerHeight - strip!.offsetHeight - PROBE_ABOVE
    const hit = document.elementsFromPoint(window.innerWidth / 2, Math.max(0, y))[0]
    if (!hit) return

    const zone = hit.closest<HTMLElement>('[data-nav-ink]')
    const color =
      zone?.dataset.edgeColor ||
      opaqueBackground(hit.closest('section, footer, [data-nav-ink]')) ||
      (zone?.dataset.navInk === 'light' ? 'var(--color-neutral-950)' : 'var(--color-canvas)')

    if (color === current) return
    current = color
    root.style.setProperty('--edge-bottom-background', color)
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(resolve)
  }

  resolve()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  // The invert-zone flips on a CSS transition after its ScrollTrigger
  // fires, with no scroll in between; catch the settled colour.
  document.addEventListener('transitionend', schedule)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    document.removeEventListener('transitionend', schedule)
    root.style.removeProperty('--edge-bottom-background')
  }
}
