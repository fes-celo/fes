/**
 * Dev-only type inspector.
 *
 * Purpose: give every piece of text on the site a NAME you can point at, so
 * a typography change can be asked for as “Hero deck → text-h2” instead of
 * “make this look like that other page”.
 *
 * Toggle with Shift+T (or the chip in the bottom-left). While it's on,
 * hovering any text shows its step, its live px size at the current
 * viewport, and the component + line it was authored on; clicking copies
 * that reference to the clipboard.
 *
 * Never imported outside `import.meta.env.DEV` — see BaseLayout.astro.
 */
import { typeScale } from './typeScale'

const UI_ATTR = 'data-type-inspector-ui'

let active = false
let cleanup: (() => void) | null = null
let root: HTMLElement | null = null
let chip: HTMLElement | null = null
let outline: HTMLElement | null = null
let toggle: HTMLElement | null = null

/**
 * Resolve each `--text-*` token to real pixels at the CURRENT viewport.
 * `getComputedStyle().getPropertyValue()` hands back the unresolved
 * `clamp(...)` token stream for custom properties, so the only way to read
 * the number the browser actually lands on is to apply it to something and
 * measure — hence the offscreen probe.
 */
function measureTokens(): { token: string; px: number }[] {
  const probe = document.createElement('span')
  probe.setAttribute(UI_ATTR, '')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;top:-9999px'
  document.body.append(probe)

  const measured = typeScale.map((step) => {
    probe.style.fontSize = `var(--text-${step.token})`
    return { token: step.token, px: parseFloat(getComputedStyle(probe).fontSize) }
  })

  probe.remove()
  return measured
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function isTextish(el: Element): boolean {
  // Only elements with their OWN text — otherwise every wrapper <div> up the
  // tree matches and hovering reports the outermost <section>.
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true
  }
  return false
}

/** The step this element renders at, and whether it came from a class or from measuring. */
function stepFor(el: Element, tokens: { token: string; px: number }[]) {
  const px = parseFloat(getComputedStyle(el).fontSize)

  // A class on the element itself is the ground truth. Inherited sizes are
  // resolved by measurement below rather than by walking up looking for the
  // class, so a parent's class doesn't get reported for a child that
  // overrides it.
  const named = typeScale.find((s) => el.classList.contains(s.className))
  if (named) return { label: named.className, px, offScale: false }

  const near = tokens.find((t) => Math.abs(t.px - px) < 0.6)
  if (near) return { label: `text-${near.token}`, px, offScale: false }

  // No token within half a pixel — this text is on a hardcoded size. Worth
  // surfacing loudly; it's usually an oversight rather than a decision.
  return { label: 'off-scale', px, offScale: true }
}

/**
 * `src/components/Hero.astro:34`. Astro only stamps these attributes when the
 * dev toolbar preference is enabled (`npx astro preferences enable
 * devToolbar`), so this is a bonus, not the reference — `landmarkOf` below is
 * what always works.
 */
function sourceOf(el: Element): string | null {
  const owner = el.closest<HTMLElement>('[data-astro-source-file]')
  if (!owner) return null
  const file = owner.dataset.astroSourceFile ?? ''
  const loc = owner.dataset.astroSourceLoc ?? ''
  const rel = file.split('/src/')[1]
  return rel ? `src/${rel}${loc ? `:${loc.split(':')[0]}` : ''}` : null
}

/**
 * A human-readable address for this element: page, the section it sits in
 * (named by its aria-label, its id, or its own heading), and which of the
 * same-tag siblings in that section it is. Everything a typography request
 * needs in order to be unambiguous without a line number.
 */
function landmarkOf(el: Element): string {
  const page = location.pathname
  const section = el.closest('section, header, footer, article, nav')

  let where = ''
  if (section) {
    const named =
      section.getAttribute('aria-label') ||
      section.id ||
      section.querySelector('h1, h2, h3')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40)
    where = named ? ` › ${section.tagName.toLowerCase()} “${named}”` : ` › ${section.tagName.toLowerCase()}`
  }

  const scope = section ?? document.body
  const peers = [...scope.querySelectorAll(el.tagName)]
  const nth = peers.length > 1 ? ` #${peers.indexOf(el) + 1}/${peers.length}` : ''

  return `${page}${where} › ${el.tagName.toLowerCase()}${nth}`
}

function buildUI() {
  root = document.createElement('div')
  root.setAttribute(UI_ATTR, '')
  root.innerHTML = `
    <style>
      [${UI_ATTR}] { font-family: ui-monospace, monospace; }
      .ti-outline {
        position: absolute; pointer-events: none; z-index: 2147483646;
        outline: 1px solid #4A40F2; background: rgb(74 64 242 / 0.08);
      }
      .ti-chip {
        position: fixed; pointer-events: none; z-index: 2147483647;
        max-width: 24rem; padding: 6px 8px; border-radius: 4px;
        background: #151617; color: #fff; font-size: 11px; line-height: 1.45;
        box-shadow: 0 4px 16px rgb(0 0 0 / 0.35); white-space: pre-wrap;
      }
      .ti-chip b { color: #A3B1FF; font-weight: 500; }
      .ti-chip .ti-warn { color: #EEA287; }
      .ti-chip .ti-dim { color: #96989C; }
      .ti-toggle {
        position: fixed; left: 12px; bottom: 12px; z-index: 2147483647;
        padding: 5px 9px; border-radius: 999px; border: 0; cursor: pointer;
        background: #151617; color: #96989C; font-size: 11px; font-family: inherit;
      }
      .ti-toggle[data-on='true'] { background: #4A40F2; color: #fff; }
    </style>
  `
  outline = document.createElement('div')
  outline.className = 'ti-outline'
  outline.style.display = 'none'

  chip = document.createElement('div')
  chip.className = 'ti-chip'
  chip.style.display = 'none'

  const toggleButton = document.createElement('button')
  toggleButton.className = 'ti-toggle'
  toggleButton.type = 'button'
  toggleButton.dataset.on = 'false'
  toggle = toggleButton
  toggleButton.textContent = 'type ⇧T'

  root.append(outline, chip, toggle)
  document.body.append(root)
}

export function initTypeInspector() {
  if (root) return
  buildUI()

  let tokens = measureTokens()
  let current: Element | null = null

  function paint(el: Element) {
    const { label, px, offScale } = stepFor(el, tokens)
    const cs = getComputedStyle(el)
    const src = sourceOf(el)
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 48)

    const rect = el.getBoundingClientRect()
    outline!.style.display = 'block'
    outline!.style.top = `${rect.top + window.scrollY}px`
    outline!.style.left = `${rect.left + window.scrollX}px`
    outline!.style.width = `${rect.width}px`
    outline!.style.height = `${rect.height}px`

    chip!.style.display = 'block'
    chip!.innerHTML =
      `<b class="${offScale ? 'ti-warn' : ''}">${label}</b>  ${px.toFixed(1)}px` +
      ` <span class="ti-dim">/ lh ${(parseFloat(cs.lineHeight) / px).toFixed(2)} / w${cs.fontWeight}</span>\n` +
      `<span class="ti-dim">${escapeHtml(src ?? landmarkOf(el))}</span>\n` +
      `<span class="ti-dim">“${escapeHtml(text)}”  ·  click to copy</span>`

    // Flip above the cursor near the bottom edge, and clamp to the right.
    const top = rect.bottom + 8
    chip!.style.top = `${top + 90 > window.innerHeight ? rect.top - 8 - chip!.offsetHeight : top}px`
    chip!.style.left = `${Math.min(rect.left, window.innerWidth - chip!.offsetWidth - 12)}px`
  }

  function hide() {
    current = null
    outline!.style.display = 'none'
    chip!.style.display = 'none'
  }

  function onMove(e: MouseEvent) {
    if (!active) return
    let el = document.elementFromPoint(e.clientX, e.clientY)
    while (el && !isTextish(el)) el = el.parentElement
    if (!el || el.closest(`[${UI_ATTR}]`)) return hide()
    if (el === current) return
    current = el
    paint(el)
  }

  async function onClick(e: MouseEvent) {
    if (!active || !current) return
    if ((e.target as Element).closest(`[${UI_ATTR}]`)) return
    e.preventDefault()
    e.stopPropagation()

    const { label, px } = stepFor(current, tokens)
    const src = sourceOf(current)
    const text = (current.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60)
    const ref =
      `${landmarkOf(current)}${src ? `  [${src}]` : ''}\n` +
      `${label} · ${px.toFixed(1)}px @ ${window.innerWidth}px viewport\n` +
      `"${text}"`

    try {
      await navigator.clipboard.writeText(ref)
      chip!.innerHTML = '<b>copied</b>\n' + escapeHtml(ref)
    } catch {
      // Clipboard is origin/permission gated; log it so the reference is
      // still recoverable from the console.
      console.log('[type inspector]', ref)
    }
  }

  function setActive(next: boolean) {
    active = next
    toggle!.dataset.on = String(next)
    document.documentElement.style.cursor = next ? 'crosshair' : ''
    if (!next) hide()
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && active) return setActive(false)
    // Shift+T, but not while typing into a field.
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.shiftKey && (e.key === 'T' || e.key === 't')) setActive(!active)
  }

  function onScrollOrResize() {
    tokens = measureTokens()
    if (active && current) paint(current)
  }

  toggle!.addEventListener('click', () => setActive(!active))
  document.addEventListener('mousemove', onMove)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize)

  cleanup = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('scroll', onScrollOrResize)
    window.removeEventListener('resize', onScrollOrResize)
    root?.remove()
    root = chip = outline = toggle = null
    document.documentElement.style.cursor = ''
  }
}

export function teardownTypeInspector() {
  cleanup?.()
  cleanup = null
  active = false
}
