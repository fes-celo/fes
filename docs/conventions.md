# Animation-ready markup conventions

The site ships motionless from Phase 0B through Phase 1. These conventions get
authored into every page from Phase 1 onward regardless — retrofitting
animation-ready markup after scripts already exist is the expensive path.
GSAP + `<ClientRouter />` land in Phase 1.5.

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

## Lifecycle: `astro:page-load` / `astro:before-swap`

With `<ClientRouter />` enabled site-wide (Phase 0B), animations must
(re)initialize on every navigation, not just the first page load:

- `astro:page-load` — fires after every navigation (including the initial
  load). Initialize scroll-triggers and split-text here, not on
  `DOMContentLoaded`.
- `astro:before-swap` — fires before the incoming page replaces the outgoing
  one. Tear down/kill any running ScrollTrigger instances and timelines here
  to avoid leaks and duplicate triggers stacking across navigations.

```js
document.addEventListener('astro:page-load', () => {
  // init ScrollTrigger / SplitText instances
})

document.addEventListener('astro:before-swap', () => {
  // ScrollTrigger.getAll().forEach((t) => t.kill())
})
```

This pattern is already validated for this project — don't reopen it.
