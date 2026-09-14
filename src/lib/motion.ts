/**
 * Entrance choreography for the `data-anim` attributes that were already
 * annotated throughout the site but had no handler anywhere in src/ — every
 * `data-anim="reveal"` and `data-anim="split-text"` was inert markup.
 *
 * Two rules shape the implementation:
 *
 * 1. The hidden state is set from JS (gsap.set), never from CSS. A CSS
 *    `opacity: 0` default would leave the whole site blank if the bundle
 *    fails or is blocked; this way no-JS gets the plain, fully visible page
 *    and the animation is purely additive.
 *
 * 2. Nothing animates a <section> box itself. The homepage stacks a sticky
 *    hero, a scroll-driven light/dark invert zone and a footer reveal that
 *    measures <main>'s bottom edge — transforming or fading the section
 *    elements those depend on would fight all three. A section marked
 *    `reveal` animates its content children instead, so section geometry and
 *    backgrounds stay exactly where the layout put them.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

// Mobile Safari's address bar hiding/showing on scroll fires resize events,
// which by default trigger a full ScrollTrigger.refresh() — recalculating
// every trigger's start/end mid-scroll can strand a `once: true` reveal at
// its `gsap.from` opacity:0 state (the projects-page filter is one of these
// reveal targets, so this can present as the filter never becoming visible
// or interactive). https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.config()
ScrollTrigger.config({ ignoreMobileResize: true })

// Tuning surface — the taste knobs live here rather than scattered inline.
const REVEAL = { y: 24, duration: 0.8, stagger: 0.08, ease: 'power2.out', start: 'top 85%' }
const SLIDE_RIGHT = { x: 100, duration: 0.7, stagger: 0.1, ease: 'power2.out', start: 'top 85%' }
const SPLIT = { y: '110%', duration: 0.9, stagger: 0.07, ease: 'power3.out', start: 'top 85%' }
/** How far the per-line clip box extends below the line box to clear descenders. */
const DESCENDER_PAD = '0.2em'

type Cleanup = () => void

/**
 * Anything already on screen when motion initialises plays as a load-in
 * sequence; only off-screen elements wait for a scroll trigger.
 *
 * Without this split, `start: 'top 85%'` strands above-the-fold content: the
 * hero paragraph sits at ~86% of the viewport height, so it stayed at
 * opacity 0 until the user happened to scroll. Content visible at rest must
 * never depend on a scroll that may not come.
 */
function isInView(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0
}

/** Scroll-triggered, or immediate for elements already in view. */
function schedule(el: HTMLElement, vars: gsap.TweenVars, start: string): gsap.TweenVars {
  return isInView(el) ? { ...vars, delay: 0.15 } : { ...vars, scrollTrigger: { trigger: el, start, once: true } }
}

/**
 * What a `reveal` should actually move. A section animates its content
 * children; a section wrapping everything in one layout div unwraps one
 * level further so the reveal reads as a stagger rather than one slab.
 * Anything that isn't a section animates itself.
 */
function revealTargets(el: HTMLElement): HTMLElement[] {
  if (el.tagName !== 'SECTION') return [el]

  let children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
  if (children.length === 1 && children[0].children.length > 1) {
    children = Array.from(children[0].children).filter((c): c is HTMLElement => c instanceof HTMLElement)
  }
  // A child marked `slide-right` (the testimonial tracks) runs its own
  // per-card entrance below — left in here it would additionally animate as
  // one block under the section's fade, doubling up.
  children = children.filter((c) => c.dataset.anim !== 'slide-right')
  return children.length > 0 ? children : [el]
}

function setupReveals(reduced: boolean): Cleanup[] {
  const cleanups: Cleanup[] = []

  document.querySelectorAll<HTMLElement>('[data-anim="reveal"]').forEach((el) => {
    const targets = revealTargets(el)
    if (targets.length === 0) return

    // Reduced motion still gets the reveal, just as a plain cross-fade with
    // no travel — the appearance cue survives, the movement doesn't.
    const from = reduced ? { opacity: 0 } : { opacity: 0, y: REVEAL.y }

    const tween = gsap.from(
      targets,
      schedule(
        el,
        {
          ...from,
          duration: reduced ? 0.4 : REVEAL.duration,
          stagger: reduced ? 0 : REVEAL.stagger,
          ease: REVEAL.ease,
        },
        REVEAL.start
      )
    )

    cleanups.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(targets, { clearProps: 'opacity,transform' })
    })
  })

  return cleanups
}

/**
 * `data-anim="slide-right"` — the testimonial/feedback card tracks. Each
 * direct child (one `TestimonialCard` figure) slides in from the right and
 * settles into its resting position, staggered, the first time the track
 * scrolls into view. Kept separate from `setupReveals` because it targets
 * individual cards rather than section-level blocks, and moves on x instead
 * of y.
 *
 * Position only, no opacity fade: the cards carry their own
 * `transition-opacity` (the carousel's active/inactive dimming), and a CSS
 * transition on a property fights a JS tween on that same property — the
 * transition's generated value outranks GSAP's inline write in the cascade,
 * so the fade never actually reached the resting opacity. Sliding position
 * doesn't have a competing transition, so it's left as the only motion.
 *
 * Reduced motion: skipped entirely rather than swapped for a cross-fade —
 * the same clash would apply, and no motion is the correct outcome anyway.
 */
function setupSlideRight(reduced: boolean): Cleanup[] {
  if (reduced) return []

  const cleanups: Cleanup[] = []

  document.querySelectorAll<HTMLElement>('[data-anim="slide-right"]').forEach((track) => {
    const targets = Array.from(track.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
    if (targets.length === 0) return

    const tween = gsap.from(
      targets,
      schedule(
        track,
        {
          x: SLIDE_RIGHT.x,
          duration: SLIDE_RIGHT.duration,
          stagger: SLIDE_RIGHT.stagger,
          ease: SLIDE_RIGHT.ease,
        },
        SLIDE_RIGHT.start
      )
    )

    cleanups.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(targets, { clearProps: 'transform' })
    })
  })

  return cleanups
}

/**
 * Groups `el`'s text into visual line strings, in document order, without
 * mutating the DOM until every line boundary is already known.
 *
 * Exists because GSAP SplitText's own `type: 'lines'` grouping (see
 * node_modules/gsap/src/SplitText.ts, `_splitWordsAndCharsRecursively` +
 * `_getWrapper`) wraps every WORD in its own measuring
 * `<div style="display:inline-block">` *before* it can compare positions to
 * decide which line each word lands on — and that intermediate word-wrapped
 * DOM reliably lays out narrower than the original plain-text run did,
 * confirmed by capturing `el.getBoundingClientRect().width` immediately
 * before vs. after `new SplitText(el, {type:'lines'})` on this site's
 * hero H1s: correct width going in, visibly narrower by the time the
 * constructor returned, and one extra line break baked in permanently
 * (SplitText only runs once; nothing re-splits on resize). Tried locking
 * `el`'s width to a fixed px value for the duration of the split call to
 * remove the ambiguity — sometimes enough, sometimes not: the narrowing
 * isn't a fixed ratio of the input width, so there's no single buffer
 * multiplier that's provably enough for every heading without also
 * sometimes being *too* generous and grouping more words onto a line than
 * actually fit once the buffer comes off.
 *
 * This sidesteps the whole class of bug: `Range.setStart/setEnd` +
 * `getBoundingClientRect()` reads each word's real rendered position
 * directly off the ORIGINAL, unmutated text node, so the width behind every
 * line-break decision is always exactly the one the page already committed
 * to painting — there's nothing to renegotiate.
 */
function measureLineTexts(el: HTMLElement): string[] {
  // JSX/Astro line-wrapping in the template source can leave `el` with
  // several adjacent text nodes (e.g. a template literal broken across
  // lines) even though `.textContent` reads as one clean string — merge
  // them first, or offsets computed against the full `.textContent` length
  // overshoot `el.firstChild`'s own (shorter) length and `range.setEnd`
  // throws `IndexSizeError`.
  el.normalize()
  const text = el.textContent || ''
  // Real offsets from a regex match, not `split(' ')` + an assumed
  // single-space gap between entries — some copy on the site has runs with
  // irregular whitespace (double spaces, stray line-wrap artefacts), and
  // assuming exactly one space overshoots the text node's length by the
  // end, throwing the same `IndexSizeError`.
  const wordMatches = Array.from(text.matchAll(/\S+/g))
  if (wordMatches.length === 0) return [text]

  const range = document.createRange()
  const textNode = el.firstChild
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return [text]

  const lines: string[] = []
  let lineWords: string[] = []
  let lastTop: number | null = null

  wordMatches.forEach((match) => {
    const word = match[0]
    const start = match.index ?? 0
    const end = start + word.length
    range.setStart(textNode, start)
    range.setEnd(textNode, end)
    const top = range.getBoundingClientRect().top
    if (lastTop !== null && Math.abs(top - lastTop) > 1) {
      lines.push(lineWords.join(' '))
      lineWords = []
    }
    lineWords.push(word)
    lastTop = top
  })
  if (lineWords.length) lines.push(lineWords.join(' '))

  return lines
}

/**
 * Splits `el` into `.split-line` divs and returns them plus a matching
 * revert. Two paths:
 *
 * - Plain text (the common case — every Systems-page hero, SectionIntro's
 *   `<p>`, etc.): `measureLineTexts` + hand-built divs, see that function's
 *   docstring for why.
 * - Anything with real nested markup (e.g. Agency's "frisky, focused &
 *   funky" heading, which has a literal `<br>` mid-string): falls back to
 *   GSAP SplitText's own `type: 'lines'`. `measureLineTexts` assumes a
 *   single text node — a `<br>` (or any element) splits `el.textContent`
 *   across more than one, and offsets computed against the concatenated
 *   string then overshoot whichever node the Range calls actually land in,
 *   throwing `IndexSizeError`. SplitText's recursive splitter already
 *   handles nested elements correctly, so let it own this rarer case rather
 *   than reimplementing that recursion here for content that isn't
 *   affected by the line-count bug it's affected by (see
 *   docs/parked-decisions.md's "clean single text node" convention — this
 *   heading is the one exception to it, not a pattern to design around).
 */
function buildSplitLines(el: HTMLElement): { lines: HTMLElement[]; revert: () => void } {
  const hasNestedMarkup = Array.from(el.childNodes).some((n) => n.nodeType !== Node.TEXT_NODE)
  if (hasNestedMarkup) {
    const split = new SplitText(el, { type: 'lines', linesClass: 'split-line', aria: 'none' })
    return { lines: split.lines as HTMLElement[], revert: () => split.revert() }
  }

  const originalText = el.textContent || ''
  const lineTexts = measureLineTexts(el)
  el.textContent = ''
  const textAlign = getComputedStyle(el).textAlign || 'left'
  const lines = lineTexts.map((lineText, i) => {
    const line = document.createElement('div')
    line.className = 'split-line'
    line.style.position = 'relative'
    line.style.display = 'block'
    line.style.textAlign = textAlign
    // SplitText's own line-wrapper leaves a trailing space on every line
    // but the last (the word delimiter that would otherwise start the next
    // line) — matched here mostly for whitespace-fidelity with the
    // fallback path above, not because it's load-bearing.
    line.textContent = i < lineTexts.length - 1 ? `${lineText} ` : lineText
    el.appendChild(line)
    return line
  })
  return { lines, revert: () => { el.textContent = originalText } }
}

function setupSplitText(reduced: boolean): Cleanup[] {
  const cleanups: Cleanup[] = []

  document.querySelectorAll<HTMLElement>('[data-anim="split-text"]').forEach((el) => {
    // Reduced motion: fall back to the same flat cross-fade the reveals use
    // rather than a per-line march, and skip splitting the DOM entirely.
    if (reduced) {
      const tween = gsap.from(el, schedule(el, { opacity: 0, duration: 0.4 }, SPLIT.start))
      cleanups.push(() => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(el, { clearProps: 'opacity,transform' })
      })
      return
    }

    // aria: skips adding an aria-label/aria-hidden to the split fragments —
    // this is a LINE split, so the fragments are whole word sequences that
    // read correctly in document order unaided.
    const { lines, revert } = buildSplitLines(el)

    // Line splitting turns each line into its own block, and every one of
    // them inherits the Heading component's `text-indent`. Left alone that
    // turns the brand's first-line-only indent into an indent on all lines,
    // so clear it everywhere past the first.
    lines.forEach((line, i) => {
      if (i > 0) line.style.textIndent = '0'
      // Per-line mask, so the text rises out of its own line box instead of
      // floating up from underneath the element.
      line.style.overflow = 'hidden'
      // ...but text-display runs a 0.98 line-height, so the line box bottom
      // sits ABOVE the font's descent and a flush `overflow: hidden` shears
      // the tail off every g, p and y ("impossible to ignore" lost both).
      // Pad the clip box down past the descender and cancel the padding with
      // an equal negative margin, so the mask clears the glyphs while the
      // element's laid-out height is unchanged.
      line.style.paddingBottom = DESCENDER_PAD
      line.style.marginBottom = `-${DESCENDER_PAD}`
    })

    // A second wrap gives the mask something to travel inside: .split-line
    // clips, .split-line > div does the moving.
    const inners = lines.map((line) => {
      const inner = document.createElement('div')
      inner.style.display = 'block'
      while (line.firstChild) inner.appendChild(line.firstChild)
      line.appendChild(inner)
      return inner
    })

    const tween = gsap.from(
      inners,
      schedule(
        el,
        {
          yPercent: parseFloat(SPLIT.y),
          duration: SPLIT.duration,
          stagger: SPLIT.stagger,
          ease: SPLIT.ease,
        },
        SPLIT.start
      )
    )

    cleanups.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      revert()
    })
  })

  return cleanups
}

let cleanups: Cleanup[] = []

/**
 * Resolves once the page is actually being looked at.
 *
 * GSAP's ticker is requestAnimationFrame-driven, and rAF is suspended in a
 * backgrounded tab. Initialising there would apply every `from` state
 * (opacity 0) and then never advance a frame, so a page opened in a
 * background tab — cmd-click, session restore, a prerender — would sit
 * blank until it was focused. Deferring setup keeps the untouched, fully
 * visible page as the resting state and starts the choreography when
 * there's someone to see it.
 */
function whenVisible(): Promise<void> {
  if (!document.hidden) return Promise.resolve()
  return new Promise((resolve) => {
    const onChange = () => {
      if (document.hidden) return
      document.removeEventListener('visibilitychange', onChange)
      resolve()
    }
    document.addEventListener('visibilitychange', onChange)
  })
}

// Both awaits below can outlive the page that started them (a ClientRouter
// navigation while the tab is still backgrounded, or before the font
// resolves). The generation counter lets a teardown invalidate an init that
// is still suspended, so it doesn't wake up and animate a swapped-out DOM.
let generation = 0

export async function initMotion() {
  const mine = ++generation
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  await whenVisible()

  // Aeonik is swap-loaded, and line splitting done against the fallback
  // metrics bakes in the wrong line breaks — the split lines would keep the
  // fallback's wrap points after Aeonik paints. Wait for the real font.
  try {
    await document.fonts.ready
  } catch {
    // Non-blocking: a browser without the Font Loading API just splits
    // against whatever is painted.
  }

  if (mine !== generation) return

  cleanups = [...setupReveals(reduced), ...setupSlideRight(reduced), ...setupSplitText(reduced)]
  ScrollTrigger.refresh()
}

export function teardownMotion() {
  generation++
  cleanups.forEach((fn) => fn())
  cleanups = []
}
