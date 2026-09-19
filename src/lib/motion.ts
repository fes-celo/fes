/**
 * Entrance choreography for the `data-anim` attributes that were already
 * annotated throughout the site but had no handler anywhere in src/ — every
 * `data-anim="reveal"` and `data-anim="split-text"` was inert markup.
 *
 * Two rules shape the implementation:
 *
 * 1. The animated state is owned by JS (gsap.from), and the page is never
 *    left blank without it. It used to follow from this that nothing was
 *    hidden by CSS at all — but then every navigation painted the page fully
 *    visible, and the entrance began with a visible snap to opacity 0 once
 *    the bundle ran (worst in dev, where Vite serves ~26 unbundled modules
 *    before this file executes). The pre-hide in global.css closes that gap
 *    without giving up the guarantee: it only applies under `html.js`, a
 *    class a two-line inline script sets before first paint, so no-JS still
 *    gets the plain visible page; a CSS safety animation lifts it after
 *    PREHIDE_SAFETY_MS if this bundle never arrives; and each element is
 *    released (`ARMED` class) in the same frame gsap.from writes its
 *    inline starting state, so the hand-over is never painted.
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
const SLIDE_RIGHT = {
  /** Travel as a share of the card's own width, so the entrance reads the
   *  same on a 45rem desktop card and a full-bleed phone one. */
  xRatio: 0.72,
  xMax: 560,
  duration: 0.9,
  stagger: 0.12,
  ease: 'power3.out',
  start: 'top 85%',
}
const SPLIT = { y: '110%', duration: 0.9, stagger: 0.07, ease: 'power3.out', start: 'top 85%' }
/** How far the per-line clip box extends below the line box to clear descenders. */
const DESCENDER_PAD = '0.2em'

/**
 * The CSS pre-hide's hand-over. global.css keeps every `[data-anim]` element
 * (and a reveal section's children) at `visibility: hidden` under `html.js`
 * until it carries this class; each setup adds it right after gsap.from has
 * written the inline starting state, so the element goes from "hidden by
 * CSS" to "hidden by GSAP" without a painted frame in between. Cleanup
 * removes it so a restored page starts from the same place.
 */
const ARMED = 'anim-armed'

/**
 * Must match the safety delay in global.css. Past it the CSS has already
 * lifted the pre-hide on its own — a tab opened in the background and only
 * looked at later is the everyday case — and anything on screen has been
 * plainly visible for a while. Running the entrance then would snap it to
 * opacity 0 first, the exact flash the pre-hide exists to remove, so
 * in-view elements skip their entrance instead and only the scroll-triggered
 * ones below the fold keep it.
 */
const PREHIDE_SAFETY_MS = 2500

function arm(el: HTMLElement) {
  el.classList.add(ARMED)
}

function disarm(el: HTMLElement) {
  el.classList.remove(ARMED)
}

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

/**
 * True when an in-view entrance would do more harm than good, evaluated
 * fresh for every element at the moment it is set up rather than once per
 * init — the split-text pass waits on the font and can land seconds after
 * the reveals, on the far side of the safety deadline.
 *
 * Two cases, and both end the same way: the element is armed with no tween,
 * so the pre-hide lifts onto content that is simply there.
 *
 * - `document.hidden` — a background tab (cmd-click, session restore). Its
 *   rAF is suspended, so a tween written here would never advance a frame;
 *   the page would sit at opacity 0 until it was focused. This used to be a
 *   promise that parked init until the tab was looked at, which left the
 *   CSS pre-hide holding a page nothing could release — a hidden tab
 *   rendered blank indefinitely, because an unrendered document does not
 *   advance the CSS safety animation either. Skipping beats deferring.
 * - Past PREHIDE_SAFETY_MS the CSS has already lifted the pre-hide by
 *   itself and the content has been plainly visible for a while; starting
 *   an entrance now would snap it to opacity 0 first.
 */
function entranceWouldFlash(): boolean {
  return document.hidden || performance.now() > PREHIDE_SAFETY_MS
}

/**
 * Scroll-triggered, or immediate for elements already in view — or `null`
 * for an in-view element whose entrance should be skipped (see
 * `entranceWouldFlash`), which callers must still arm.
 */
function schedule(el: HTMLElement, vars: gsap.TweenVars, start: string): gsap.TweenVars | null {
  if (!isInView(el)) return { ...vars, scrollTrigger: { trigger: el, start, once: true } }
  return entranceWouldFlash() ? null : { ...vars, delay: 0.15 }
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

    const vars = schedule(
      el,
      {
        ...from,
        duration: reduced ? 0.4 : REVEAL.duration,
        stagger: reduced ? 0 : REVEAL.stagger,
        ease: REVEAL.ease,
      },
      REVEAL.start
    )
    if (!vars) {
      arm(el)
      cleanups.push(() => disarm(el))
      return
    }

    const tween = gsap.from(targets, vars)
    arm(el)

    cleanups.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(targets, { clearProps: 'opacity,transform' })
      disarm(el)
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
 * Travel is a share of the card's own width rather than a flat 100px. At
 * 100px against a 720px card the card is already sitting in its slot when
 * the tween starts and merely drifts the last few percent — it read as a
 * nudge-and-return, not an entrance. Both tracks are clipped (the track's
 * own `overflow-x`, plus `overflow-hidden` on the section), so a card that
 * starts most of its width to the right genuinely enters from the edge.
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

    const vars = schedule(
      track,
      {
        x: (_i: number, el: HTMLElement) => Math.min(el.offsetWidth * SLIDE_RIGHT.xRatio, SLIDE_RIGHT.xMax),
        duration: SLIDE_RIGHT.duration,
        stagger: SLIDE_RIGHT.stagger,
        ease: SLIDE_RIGHT.ease,
      },
      SLIDE_RIGHT.start
    )
    if (!vars) {
      arm(track)
      cleanups.push(() => disarm(track))
      return
    }

    // Snap off for the length of the entrance. A scroll-snap area is the
    // target's *transformed* border box, so under `snap-mandatory` the
    // scrollport chases the cards while they tween and drags the track along
    // behind them — the travel cancels itself out and the whole thing reads as
    // a rubber band rather than an arrival. `gsap.from` writes its start state
    // on creation, so the suspend has to happen here, not in `onStart`.
    const restoreSnap = () => track.style.removeProperty('scroll-snap-type')
    track.style.scrollSnapType = 'none'

    const tween = gsap.from(targets, { ...vars, onComplete: restoreSnap })
    arm(track)

    cleanups.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(targets, { clearProps: 'transform' })
      restoreSnap()
      disarm(track)
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
      const vars = schedule(el, { opacity: 0, duration: 0.4 }, SPLIT.start)
      if (!vars) {
        arm(el)
        cleanups.push(() => disarm(el))
        return
      }
      const tween = gsap.from(el, vars)
      arm(el)
      cleanups.push(() => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(el, { clearProps: 'opacity,transform' })
        disarm(el)
      })
      return
    }

    // Skipped entrance: no reason to split the DOM either.
    const vars = schedule(
      el,
      {
        yPercent: parseFloat(SPLIT.y),
        duration: SPLIT.duration,
        stagger: SPLIT.stagger,
        ease: SPLIT.ease,
      },
      SPLIT.start
    )
    if (!vars) {
      arm(el)
      cleanups.push(() => disarm(el))
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

    const tween = gsap.from(inners, vars)
    arm(el)

    cleanups.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      revert()
      disarm(el)
    })
  })

  return cleanups
}

let cleanups: Cleanup[] = []

/**
 * Resolves once this document is a real page rather than a speculative one.
 *
 * A prerendered document (astro.config.mjs's `prefetch` +
 * `experimental.clientPrerender`, parked-decisions §28) reports
 * `visibilityState: 'hidden'` and runs with its rAF suspended, exactly like
 * a background tab — but unlike a background tab it is about to become the
 * page someone is looking at, at which point the entrance is precisely what
 * they should see. `prerenderingchange` fires on activation, which is the
 * moment a prerendered load becomes an ordinary one.
 *
 * Nothing else is waited on. A genuinely backgrounded tab is handled by
 * skipping the entrance outright (`entranceWouldFlash`), not by parking
 * here: an init suspended behind the CSS pre-hide is a blank page.
 */
function whenActivated(): Promise<void> {
  if (!document.prerendering) return Promise.resolve()
  return new Promise((resolve) => {
    document.addEventListener('prerenderingchange', () => resolve(), { once: true })
  })
}

// The awaits below can outlive the page that started them — a prerender
// that is never activated, or a font that resolves after the visitor has
// already navigated on. The generation counter lets a teardown invalidate
// an init that is still suspended, so it doesn't wake up and animate a
// swapped-out DOM.
let generation = 0

export async function initMotion() {
  const mine = ++generation
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  await whenActivated()
  if (mine !== generation) return

  // Two passes, split on one question: does this entrance measure text?
  //
  // Reveals and slides do not — they move a box that layout has already
  // placed — so they start as soon as the DOM is parsed. They used to sit
  // behind `document.fonts.ready` with everything else, which meant the
  // whole page stayed at `visibility: hidden` until the font resolved and
  // then released at once. That single held-then-dumped frame is most of
  // what read as "the page pops" rather than "the page arrives".
  cleanups = [...setupReveals(reduced), ...setupSlideRight(reduced)]

  // Split-text does measure: Aeonik is swap-loaded, and line breaks taken
  // against the fallback metrics get baked in permanently (nothing
  // re-splits on resize). This pass is worth the wait; the one above is
  // not.
  try {
    await document.fonts.ready
  } catch {
    // Non-blocking: a browser without the Font Loading API just splits
    // against whatever is painted.
  }
  if (mine !== generation) return

  cleanups.push(...setupSplitText(reduced))

  // After the font, so every trigger above is measured against the metrics
  // the page will actually keep.
  ScrollTrigger.refresh()
}

export function teardownMotion() {
  generation++
  cleanups.forEach((fn) => fn())
  cleanups = []
}
