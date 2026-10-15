/**
 * Safari's edges follow the page (parked-decisions §81). iOS 26 Safari
 * colours its floating bottom toolbar from a solid `position: fixed`
 * element at the bottom edge, and its status bar from `theme-color`. On a
 * page with BaseLayout's `edgeStrip` prop this keeps both on the colour of
 * the section actually behind them:
 *
 * - Bottom: `#edge-strip`, a thin fixed block at the foot of the viewport,
 *   painted the colour of the section at a probe line just above it.
 * - Top: `theme-color` and the `<html>` background, set to the colour of the
 *   section at the top of the viewport. The html background is what shows
 *   through the sub-pixel gap between Safari's status bar and the page while
 *   scrolling; left on the light canvas, it blinked as a white hairline
 *   above the dark hero (first device pass).
 *
 * The colour of a point is its SECTION's, never the element's own:
 *
 * 1. Only page content counts: the first element at the point inside
 *    `<main>` or the revealed footer that isn't in a `position: fixed`
 *    layer. The floating Book-a-call bar (ScrollCta) is fixed but rendered
 *    inside `<main>`, and in the first pass it swallowed the probe and left
 *    the strip on its own light grey over the dark stats.
 * 2. `data-edge-color` on the nearest marked ancestor, for a section whose
 *    background is a shader, a gradient or an image (the homepage hero). If
 *    that section has a `[data-hero-overlay]` dim layer, its live opacity is
 *    mixed in, so the colour darkens with the hero as it is covered.
 * 3. Otherwise the first opaque `background-color` from the nearest
 *    `section` or `footer` outwards, up to `<body>`. Starting at the section
 *    is what keeps cards out of it: the Liliana CTA card carries its own
 *    `data-nav-ink`, and in the first pass its blue took over the toolbar
 *    while the section around it is white. `data-nav-ink` marks are for the
 *    Menu button's ink and sit on cards as well as sections, so they play no
 *    part here.
 *
 * Resolved on every scroll frame rather than on IO crossings, because the
 * invert-zone changes colour without crossing anything.
 */

const PROBE_INSET = 2
const DIM = [21, 22, 23] // --color-neutral-950, the hero dim layer's colour

type RGB = [number, number, number]

export function setupEdgeStrip() {
  const strip = document.getElementById('edge-strip')
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!strip) return null

  const root = document.documentElement
  const originalThemeColor = meta?.content ?? null
  let frame = 0
  let currentBottom = ''
  let currentTop = ''

  // Any CSS colour (rgb, color(srgb …), oklab from a color-mix) to RGB, by
  // letting a 1×1 canvas parse and paint it. Only runs when a colour changes.
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  function toRGB(color: string): RGB | null {
    if (!ctx) return null
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  }
  const hex = (rgb: RGB) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('')

  function isOpaque(bg: string) {
    return !!bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg) && !/\/\s*0\)$/.test(bg)
  }

  // Whether an element sits in a fixed layer (the Book-a-call bar, the Menu
  // button). Cached: it never changes for an element, and the probe sees
  // the same few elements frame after frame.
  const fixedCache = new WeakMap<Element, boolean>()
  function inFixedLayer(el: Element): boolean {
    const cached = fixedCache.get(el)
    if (cached !== undefined) return cached
    const fixed =
      getComputedStyle(el).position === 'fixed' ||
      (!!el.parentElement && el.parentElement !== document.body && inFixedLayer(el.parentElement))
    fixedCache.set(el, fixed)
    return fixed
  }

  function colorAt(y: number): RGB | null {
    const hit = document
      .elementsFromPoint(window.innerWidth / 2, y)
      .find((el) => el.closest('#main, [data-footer-reveal]') && !inFixedLayer(el))
    if (!hit) return null

    const marked = hit.closest<HTMLElement>('[data-edge-color]')
    if (marked) {
      const base = toRGB(marked.dataset.edgeColor!)
      const overlay = marked.querySelector<HTMLElement>('[data-hero-overlay]')
      const o = overlay ? parseFloat(getComputedStyle(overlay).opacity) || 0 : 0
      return base && (base.map((v, i) => Math.round(v + (DIM[i] - v) * o)) as RGB)
    }

    for (let el: Element | null = hit.closest('section, footer') ?? hit; el; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor
      if (isOpaque(bg)) return toRGB(bg)
      if (el === document.body) break
    }
    return null
  }

  function resolve() {
    frame = 0

    const bottom = colorAt(window.innerHeight - strip!.offsetHeight - PROBE_INSET)
    if (bottom) {
      const value = hex(bottom)
      if (value !== currentBottom) {
        currentBottom = value
        root.style.setProperty('--edge-bottom-background', value)
      }
    }

    const top = colorAt(PROBE_INSET)
    if (top) {
      const value = hex(top)
      if (value !== currentTop) {
        currentTop = value
        root.style.backgroundColor = value
        if (meta) meta.content = value
      }
    }
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
    root.style.removeProperty('background-color')
    if (meta && originalThemeColor !== null) meta.content = originalThemeColor
  }
}
