# Animation-ready markup conventions

The site ships motionless from Phase 0B through Phase 1. These conventions get
authored into every page from Phase 1 onward regardless — retrofitting
animation-ready markup after scripts already exist is the expensive path.
GSAP lands in Phase 1.5.

## `data-anim` attribute

Any element that will animate on scroll-into-view or page load carries a
`data-anim` attribute naming the animation, not a class. Classes are for
styling; `data-anim` is a separate hook so JS never has to guess intent from
a Tailwind utility list.

```html
<section data-anim="reveal">...</section>
<h1 data-anim="split-text">Hero headline</h1>
```

Values in use so far: `reveal` (fade/slide-up on scroll into view),
`split-text` (character/word split for headline reveals — requires a clean
text node, see below).

## Wrapper elements for reveals

Elements that animate in need a dedicated wrapper, not the content element
itself, so the animation library can control `overflow` / `transform`
independently of the content's own layout box:

```html
<div class="overflow-hidden" data-anim-wrapper>
  <p data-anim="reveal">Content that slides up from behind the mask.</p>
</div>
```

Don't add `data-anim-wrapper` speculatively — only where a mask/clip effect
is actually planned. Most `data-anim="reveal"` elements don't need one.

## Clean text nodes for SplitText

`data-anim="split-text"` elements must contain a single text node — no
inline elements, no `{variable}` interpolation that produces nested spans,
no icons mid-sentence. GSAP's SplitText (or any split-text implementation)
walks text nodes; nested markup breaks word/char boundaries unpredictably.

```astro
<!-- Good -->
<h1 data-anim="split-text">Ideas that move.</h1>

<!-- Avoid -->
<h1 data-anim="split-text">Ideas that <em>move</em>.</h1>
```

If emphasis is required inside a split-text headline, style it after split
via a data attribute on the word index, not inline markup in the source.

## Lifecycle: `onPageLoad` / `onPageUnload`

Every client script binds its setup and teardown through
`src/lib/lifecycle.ts`, never to `DOMContentLoaded` or the old
`astro:page-load` / `astro:before-swap` pair (the site no longer ships
`<ClientRouter />` — see parked-decisions §15):

- `onPageLoad(fn)` — runs once the DOM is parsed (or immediately if it
  already is), in registration order. Initialise scroll-triggers and
  split-text here. The callback receives `{ restored }`, true when the run
  is a back/forward-cache restore rather than a fresh load; most setups
  ignore it.
- `onPageUnload(fn)` — runs only when the page is about to enter the
  back/forward cache; the `onPageLoad` callbacks run again when it is
  restored. Kill running ScrollTrigger instances and timelines here so a
  restored page comes back live instead of frozen.

The one deliberate exception is the entrance choreography in
`src/lib/motion.ts`: `BaseLayout` skips `initMotion` when `restored` is
true and never tears it down, because a restored page is the page the
visitor just left — replaying its load-in would snap content they already
saw to opacity 0 (parked-decisions §26).

### The `data-anim` pre-hide

`global.css` keeps every `[data-anim]` element (and a reveal section's
children) at `visibility: hidden` under `html.js`, a class the first inline
script in `BaseLayout`'s `<head>` sets before paint. `motion.ts` adds
`anim-armed` in the same frame it writes the GSAP starting state, which is
what releases the element. Two consequences for authors:

- Every `data-anim` value must be handled by `motion.ts`. An unhandled
  value is invisible until the 2.5s safety animation lifts it.
- Without JS there is no `html.js` and no pre-hide: the page renders plain
  and fully visible, which is the guarantee motion.ts rule 1 exists for.
- An entrance is skipped, not played, when playing it would flash: in a
  background tab (`document.hidden` — its rAF is suspended, so a tween
  written there would never advance) and past the 2.5s safety deadline
  (the CSS has already lifted the pre-hide, so starting now would snap
  visible content back to opacity 0). Both cases arm the element with no
  tween. Scroll-triggered reveals below the fold are unaffected either
  way — they keep their trigger and play when scrolled to.
- The decision is taken per element at the moment it is set up, not once
  per init: the split-text pass waits on `document.fonts.ready` and can
  land seconds after the reveals, on the far side of that deadline.
- A prerendered document also reports `document.hidden`, but it is about
  to become the page someone is looking at, so it is the one case that
  waits — `whenActivated()` holds init until `prerenderingchange`. Nothing
  else is waited on; an init parked behind the pre-hide is a blank page.
- There are no cross-document view transitions (parked-decisions §30).
  A page that renders its own primary nav (the `hideHeader` pattern) just
  renders it; no shared `view-transition-name` is involved.

```js
import { onPageLoad, onPageUnload } from '../lib/lifecycle'

onPageLoad(() => {
  // init ScrollTrigger / SplitText instances
})

onPageUnload(() => {
  // ScrollTrigger.getAll().forEach((t) => t.kill())
})
```

Keep the pair even when teardown looks unnecessary: it is what makes a
bfcache restore correct, and it is one line.
