/**
 * Safari's edges follow the page (parked-decisions §81). iOS 26 Safari
 * colours its floating bottom toolbar from a solid `position: fixed`
 * element at the bottom edge, and its status bar from `theme-color`. On a
 * page with BaseLayout's `edgeStrip` prop this keeps both on the colour of
 * the section actually behind them:
 *
 * - Bottom: `#edge-strip`, a thin fixed block at the foot of the viewport.
 * - Top: `theme-color` and the `<html>` background. The html background is
 *   what shows through the sub-pixel gap between Safari's status bar and the
 *   page while scrolling; left on the light canvas, it blinked as a white
 *   hairline above the dark hero.
 *
 * NOTHING IS READ FROM THE DOM ON A SCROLL FRAME. The second pass
 * hit-tested and read computed styles every frame and wrote theme-color
 * every frame through the hero's dim, and on an iPhone the hero's title,
 * lead and top edge stuttered as the page scrolled. Now every section's
 * document range and colour are measured up front (load, resize, any change
 * in the page's height) and a scroll frame is arithmetic on `scrollY`
 * against that table. A colour is written only when a section boundary
 * crosses an edge. Both the top and the bottom stay still through the whole
 * hero, dim included.
 *
 * The table holds every `section` in `<main>`. At a point, the one LATEST
 * in document order wins: that is the innermost of nested sections, and the
 * section that slides over the sticky hero rather than the hero under it.
 * Anything below `<main>` is the footer. Cards are not sections, so a
 * card's own colour never takes over (the Liliana CTA card did, in the
 * first pass), and fixed layers such as the Book-a-call bar are never in the
 * table (it held the strip on light grey over the dark stats). A section's
 * colour is its `data-edge-color` (for a shader, gradient or image
 * background: the homepage hero), else the first opaque `background-color`
 * from it up to `<body>`.
 *
 * The invert-zone changes its sections' backgrounds on a CSS transition
 * without moving anything, so a `transitionend` re-reads the colours (not
 * the ranges), once, after the flip has settled.
 */

const PROBE_INSET = 2

type Band = { el: HTMLElement; top: number; bottom: number; color: string }

export function setupEdgeStrip() {
  const strip = document.getElementById('edge-strip')
  const main = document.getElementById('main')
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!strip || !main) return null

  const root = document.documentElement
  const footer = document.querySelector<HTMLElement>('[data-footer-reveal]')
  const originalThemeColor = meta?.content ?? null

  let bands: Band[] = []
  let mainBottom = 0
  let footerColor = ''
  let stripHeight = 12
  let viewportHeight = window.innerHeight
  let frame = 0
  let currentBottom = ''
  let currentTop = ''

  function isOpaque(bg: string) {
    return !!bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg) && !/\/\s*0\)$/.test(bg)
  }

  // Any CSS colour (rgb, color(srgb …), oklab from a color-mix) to #rrggbb,
  // by letting a 1×1 canvas paint it, so theme-color always gets a value
  // Safari parses. Measure time only, never on a scroll frame.
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  function toHex(color: string) {
    if (!ctx) return color
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  }

  function colorOf(el: HTMLElement) {
    if (el.dataset.edgeColor) return toHex(el.dataset.edgeColor)
    for (let node: Element | null = el; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor
      if (isOpaque(bg)) return toHex(bg)
      if (node === document.body) break
    }
    return ''
  }

  /** Re-reads every colour; true when any of them changed. */
  function readColors() {
    let changed = false
    for (const band of bands) {
      const color = colorOf(band.el)
      if (color !== band.color) changed = true
      band.color = color
    }
    const next = footer ? colorOf(footer) : ''
    if (next !== footerColor) changed = true
    footerColor = next
    return changed
  }

  function measure() {
    const y = window.scrollY
    bands = [...main!.querySelectorAll<HTMLElement>('section')].map((el) => {
      const r = el.getBoundingClientRect()
      return { el, top: r.top + y, bottom: r.bottom + y, color: '' }
    })
    mainBottom = main!.getBoundingClientRect().bottom + y
    stripHeight = strip!.offsetHeight
    viewportHeight = window.innerHeight
    readColors()
  }

  function colorAt(docY: number) {
    if (docY >= mainBottom) return footerColor
    for (let i = bands.length - 1; i >= 0; i--) {
      const band = bands[i]
      if (docY >= band.top && docY < band.bottom && band.color) return band.color
    }
    return ''
  }

  function paint() {
    frame = 0
    const y = window.scrollY

    const bottom = colorAt(y + viewportHeight - stripHeight - PROBE_INSET)
    if (bottom && bottom !== currentBottom) {
      currentBottom = bottom
      strip!.style.backgroundColor = bottom
    }

    const top = colorAt(y + PROBE_INSET)
    if (top && top !== currentTop) {
      currentTop = top
      root.style.backgroundColor = top
      if (meta) meta.content = top
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint)
  }

  function remeasure() {
    measure()
    schedule()
  }

  // Only background transitions, and only a real change repaints: the
  // entrance animations end transitions all over the page, and re-writing
  // theme-color with the same value on each was the first version of this.
  let colorFrame = 0
  function onTransitionEnd(e: TransitionEvent) {
    if (e.propertyName !== 'background-color' || colorFrame) return
    colorFrame = requestAnimationFrame(() => {
      colorFrame = 0
      if (!readColors()) return
      // A colour changed under a still edge: force the next paint to write.
      currentBottom = currentTop = ''
      paint()
    })
  }

  measure()
  paint()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', remeasure)
  document.addEventListener('transitionend', onTransitionEnd)
  // Late images, the font swap and ScrollTrigger pin spacers all move the
  // section ranges after first paint.
  const observer = new ResizeObserver(remeasure)
  observer.observe(main)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    if (colorFrame) cancelAnimationFrame(colorFrame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', remeasure)
    document.removeEventListener('transitionend', onTransitionEnd)
    observer.disconnect()
    strip.style.removeProperty('background-color')
    root.style.removeProperty('background-color')
    if (meta && originalThemeColor !== null) meta.content = originalThemeColor
  }
}
