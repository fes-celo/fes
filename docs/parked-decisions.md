# Parked decisions

Decisions taken during implementation that were **not** in the brief, that
resolve an ambiguity in it, or that deviate from a design/spec on purpose.
Parked here rather than settled silently, so the next person changing this
area knows the choice was deliberate and what it cost.

Format: what was decided · why · what would reopen it.

---

## Template-level — affects all three Systems pages

These were decided while building the first Systems sub-page (Influence &
Reputation) but apply to Growth Communication System and Creative Projects
Blueprint too, since they share the same components. Changing any of them
means changing it for all three.

### 1. Pinned + 3D choreography is disabled below 1024px

**Decided:** `SystemExpertiseRotator`, `SystemProblemCards` and
`PhasesScroll` gate their pinned branch on
`(prefers-reduced-motion: no-preference) and (min-width: 1024px)`. Narrow
viewports fall through to the *same* branch reduced-motion uses — there is
one fallback, not two.

**Why:** 1024px is the site's existing `lg` breakpoint, not a new number. Below
it the layout is single-column, so a pinned section spends a full viewport of
scroll to show one word. Scroll-jacking is also at its most hostile on touch,
where the user has no scrollbar to tell them how long the lock lasts.

**Cost:** mobile users never see the split-flap or the horizontal parallax —
the two most distinctive effects on the page.

**Reopen if:** the client explicitly asks for the pinned treatment on phones,
or the Systems pages get a mobile-specific design.

### 2. Reduced motion is a real fallback, not a disabled state

**Decided:** per section — rotator crossfades the words on a slow timer (no
pin, no 3D); problem cards become a native `scroll-snap` row (no pin, no
parallax); approach stepper becomes a plain vertical list of all four steps
(no pin, no lock); Built-for crossfades with no vertical travel; addons
marquee stops autoplaying but stays draggable.

**Why:** the content has to remain reachable. A reduced-motion user who only
ever sees step 01 of four has lost information, not just animation. Matches
how `src/lib/motion.ts` already treats reduced motion sitewide (opacity
fade, no travel).

**Reopen if:** an accessibility review prefers a fully static presentation
over slow crossfades.

### 3. Resting CSS state is the fallback, not the animated state

**Decided:** components render their fallback layout by default and opt *in*
to the pinned layout from JS (`data-motion="pinned"`). The one exception is
`SystemExpertiseRotator`, where CSS hides all words but the first.

**Why:** `src/lib/motion.ts` established the rule that hidden states come
from JS so a script failure can't blank the page. Stacked rotators invert
that: their no-JS state is N items painted on top of each other, which is
worse than hiding. So the rule is followed where it helps and consciously
inverted for the one stacking case, where showing only the first item is the
better failure mode.

**Reopen if:** never, without re-reading the reasoning in `motion.ts`.

### 4. "Our approach" is a stepper, not the Figma's static row

**Decided:** Figma (node 927:1168) lays the four approach steps out as a
static 4-column row that overflows the 1920 artboard. Implemented as a
pinned, step-locked sequence per the motion brief.

**Why:** the brief explicitly specified the stepper. Noting it because the
design file and the build genuinely disagree, and the next person comparing
them will assume the build is wrong.

**Also added, not in Figma:** a small progress rail (`— 01 — 02 — 03 — 04`)
above the active step. A scroll-locked section has to signal how much lock
remains, or the pin reads as a broken page.

**Reopen if:** the designer updates the frame to match, or rejects the rail.

### 5. Parallax is bounded intra-card drift, not 0.6× of track travel

**Decided:** the brief asked for the card's inner image layer to move at
~0.6× the shell's rate. Implemented as the photo being cut 118% of card
width and drifting ±6% across its own slack.

**Why:** taken literally, 0.6× of the track's ~820px travel would slide each
photo ~330px out of a ~545px card. Same depth cue, at a scale the card can
contain.

**Reopen if:** the cards get wide enough that a literal rate would stay in
bounds.

---

## Page-level — Influence & Reputation

### 6. Copy is translated to English, and is not client-approved

**Decided:** the Figma frame is authored mostly in Portuguese with English
headings mixed in. Everything ships in English (British spelling, matching
"favourite clients" on the Agency page).

**Why:** the rest of the live site is English-only. Explicitly chosen by
Marcelo over shipping the PT/EN mix verbatim.

**Cost:** this is the one page whose copy was **not** taken literally from
Figma, so it breaks the project's usual literal-content convention. Roughly
fifteen blocks of client marketing copy were authored by translation and
have not been reviewed. The Portuguese original is in the Figma frame.

**Reopen if:** the client reviews the translation, or a PT locale lands.

### 7. Approach step 04's description is invented

**Decided:** Figma node 928:1500 (step 04, "Strategic Relationships") repeats
step 03's description verbatim — evidently a copy-paste in the design. Wrote
a description to fit the step title instead.

**Reopen if:** the client supplies the real copy. Marked `TODO(marcelo)` in
the page.

### 8. Selected projects are page-local, not in `src/lib/projects.ts`

**Decided:** the four curated projects live in an array on the page. Two of
them (Anchorage Digital, Bridge In) have no entry, thumbnail, category or
route anywhere in the project.

**Why:** chosen by Marcelo. Adding them to the shared taxonomy would put
untagged projects into the `/projects/` filter.

**Cost:** those two render with `ProjectCard`'s built-in no-image state, and
all four link to `/projects/<slug>/` detail routes that don't exist yet —
a pre-existing sitewide gap (`projects.ts` already links to them from
`/projects/`), not something this page introduces.

**Reopen if:** real thumbnails arrive, or project detail routes get built.

### 9. Hero is not `position: sticky`

**Decided:** the homepage, Agency and Systems-hub heroes are sticky, so later
sections scroll over them on the z-axis. This hero sits in normal flow.

**Why:** this page puts three ScrollTrigger pins below the hero. A sticky
element above a pin-spacer is a stacking-context fight with no visual upside,
and pinned sections here are already the page's biggest risk.

**Reopen if:** the sticky reveal is considered brand-critical on sub-pages —
but re-test all three pins if so.

### 10. `Eyebrow.astro` was not built

**Decided:** the brief asked for a new `Eyebrow.astro` (CSS Grid +
`align-items: start` + a `--eyebrow-nudge` translateY). Not built; the Impact
section reuses `SectionIntro.astro` instead.

**Why:** chosen by Marcelo. `SectionIntro` already solves this, and its own
comment explicitly rejects grid: a float lets the heading's first line wrap
*around* the eyebrow, deriving the indent from the eyebrow's rendered width.
Grid columns shift every line equally and lose the indent.

**Reopen if:** a layout appears where the eyebrow is a genuinely separate
column with its own rule, which grid would suit and the float would not.

---

## Sitewide issues found while building this page

### 11. FIXED — `SplitText` put a prohibited `aria-label` on `<p>`

`src/lib/motion.ts` split headlines with SplitText's default `aria: 'auto'`,
which stamps `aria-label` onto the split element. That's prohibited on a
generic role like `<p>`, and `SectionIntro.astro` splits a `<p>` — so axe
flagged a WCAG violation on Agency, Careers and every Systems page. Changed
to `aria: 'none'`, which is safe for a `type: 'lines'` split because the
fragments are whole word sequences that read correctly in document order.
Took this page's Lighthouse accessibility from 91 → 100 on desktop.

### 12. FIXED — footer locale switcher failed colour contrast

`BaseLayout.astro`'s footer rendered the inactive locale as
`<span class="opacity-40">/</span><span class="opacity-40">pt</span>`, which
measured **2.37:1** against white — below the 4.5:1 required for 16px text.
Axe flagged it on every page. It was left open here because the 40% opacity
is a deliberate "inactive locale" design signal, making the fix a design call
rather than a mechanical one.

The design call taken: **drop the inactive half entirely** rather than
recolour it. The footer now renders the current locale alone (`EN`). A
disabled-looking label pointing at a PT translation that doesn't exist is a
promise the site doesn't keep, and the contrast problem only existed because
of it — recolouring would have made an unreachable locale *more* prominent.

**Reopen when PT lands:** restore it as a real switcher — two links, the
inactive one at a colour that passes 4.5:1 (neutral-500 or darker), not an
opacity on neutral-900.

### 13. Mobile Lighthouse performance is tight sitewide

Measured against the production build on throttled 4G / slow CPU:

| Page | Mobile perf |
|---|---|
| `/systems/` | 99 |
| `/agency/` | 89 |
| `/systems/influence-reputation/` | 92 (median of 3: 90 / 95 / 92) |

Mobile runs vary by ±5 points run-to-run, so single runs are not a reliable
gate — take a median of three. `/agency/` already sits below the project's
≥90 floor, so this is a site baseline issue, not one introduced by this page.

To get this page over the line, `SystemAddonsMarquee` loads
`src/lib/horizontalLoop.ts` (and with it GSAP Draggable + InertiaPlugin,
~40KB) via dynamic `import()` behind an IntersectionObserver rather than at
module scope. The LCP element here is *text*, so module parsing before first
paint delays the headline directly. Dropped initial JS from 190KB to 150KB.

**Worth doing next:** the same treatment for the other below-the-fold section
scripts, and a look at the render-blocking CSS bundle (three self-hosted
Inter weights are imported in `global.css` purely as an Aeonik fallback).

---

## Homepage

### 14. Testimonial `tag` is wired but unset

**Decided:** `src/pages/index.astro` passes `tag={t.tag}` to every
`TestimonialCard`, and no testimonial carries one. The array is explicitly
typed `{ quote; name; role; tag?: string }[]` so the prop type-checks; the
card renders the eyebrow only `{tag && ...}`, so the section is complete
without it.

**Why:** the testimonials were specced with a tag identifying the *service*
and the *area* each client falls under (the same taxonomy the Systems pages
use). That copy hasn't been assigned per client yet. Removing the prop and
re-adding it later means re-threading it through `TestimonialCard`, the
homepage and any other consumer; leaving it wired costs one optional field.

**How this surfaced:** as an `astro check` error — `Property 'tag' does not
exist on type '{ quote: string; name: string; role: string; }'`, because the
array was inferred rather than annotated. The annotation is the fix; the
untagged data is the decision.

**Reopen if:** the tags are assigned (fill them in), or the design drops the
eyebrow from the testimonial card entirely (then remove the prop).

---

## Performance, deployment and hygiene pass (2026-09-18)

Ten decisions taken in one pass, after an independent audit of the built
site (Lighthouse mobile on the production output, plus a read of every
script's load path). None of them were in the brief.

### 15. `<ClientRouter />` is gone; `src/lib/lifecycle.ts` replaces the event pair

**Decided:** BaseLayout no longer renders `<ClientRouter />`. Every client
script that bound `astro:page-load` / `astro:before-swap` now calls
`onPageLoad(fn)` / `onPageUnload(fn)` from `src/lib/lifecycle.ts`. Load
callbacks run at `DOMContentLoaded` in registration order (the same order
the listeners fired in); unload callbacks run only when the page enters the
back/forward cache, and load callbacks run again when it is restored.

**Why:** no page used a `transition:*` directive, so the router bought
nothing visible. It cost 16KB on every page and a lifecycle every component
had to get right — the docs call it "the trap", and two comments in the
code apologise for Safari firing the event twice. Without the router, a full
navigation on a static CDN-served site is as fast as a fetch-and-swap. The
setup/teardown pairs were kept rather than flattened because they are
exactly what a bfcache restore needs.

**Reopen if:** a design needs state to survive a navigation (persistent
audio player, the shader kept running). Re-add the router and swap the two
helpers back to the event names — every call site is one line. The
shared-element hero and the persistent nav are not covered by anything
today — §29 tried the browser's cross-document view transitions and §30
removed them.

### 16. Stylesheets are inlined into every page

**Decided:** `build.inlineStylesheets: 'always'` in `astro.config.mjs`.

**Why:** the site's CSS was one 50KB Tailwind bundle plus a ~8KB per-page
chunk on the Systems pages, each a render-blocking request; on a throttled
phone they measured 175–325ms of blocking on their own. Inlined, the HTML
carries everything first paint needs (fonts are preloaded), for ~10KB brotli
per page that a shared file would have cached between navigations — a fair
trade on a fifteen-page site where most visits are one or two pages.

**Reopen if:** the site grows into something people browse deeply (a blog,
a resources section with dozens of pages) — then a shared, cached stylesheet
wins back.

### 17. Inter is gone; the Aeonik fallback is a metric-matched local font

**Decided:** the three `@fontsource/inter` imports and the dependency are
removed. `--font-sans` falls back to `"Aeonik Fallback"` (local Helvetica
Neue) and `"Aeonik Fallback Arial"` (local Arial), each declared with
`size-adjust` and ascent/descent overrides computed from Aeonik's own
metrics (read from the woff2 with fontkit; the formula is in global.css).

**Why:** the fallback face was itself a web font, so on a slow connection
the browser downloaded Inter to paint provisional text and then Aeonik to
replace it, and every line reflowed at the swap. A `local()` face costs no
request, and the overrides keep line breaks where Aeonik will put them.

**Reopen if:** Aeonik's files are replaced (recompute the four numbers) or
the site picks up a script Helvetica/Arial can't render.

### 18. No Cloudflare adapter; target is Cloudflare Pages, output is a flat `dist/`

**Decided:** `@astrojs/cloudflare` and `wrangler` are removed, along with
`wrangler.jsonc`. `astro build` now writes a flat `dist/` (no
`dist/client`/`dist/server` split). `_headers` carries the `/_astro/*`
immutable rule the adapter used to inject. `npm run build` runs
`tools/prune-unreferenced-assets.mjs` before the redirect step.

**Why:** the adapter existed only to force `imageService: 'compile'`, which
a static build gets from the default sharp service anyway, and it is what
made `wrangler.jsonc` describe a Worker (`main` + `assets: ./dist`) for a
site with no server code — the deploy would have served the wrong directory.
Pages reads `_redirects` and `_headers` from the output as-is and hosts the
contact form's server half as a Pages Function under `functions/`.

The prune script exists because a plain static build keeps every original
image whose metadata a component *read* (Astro's "referenced" proxy fires
on `.width` and `.format`, which ProjectCard and SelectedProjectsRotator
read constantly): 53 originals, 45MB, none of them fetchable. The script
deletes anything under `_astro/` that no file in `dist/` names.

**Reopen if:** a real server route appears (auth, personalisation, an API
beyond the one Pages Function). Then it is Workers with static assets, and
the adapter comes back.

### 19. The three `/dark/` page variants are deleted

**Decided:** `branding/dark`, `events-activations/dark` and
`podcast-video-series/dark` are removed from `src/pages/`, and `/dark/` from
the sitemap's noindex list. Influence & Reputation and Digital
Communication remain the site's two dark pages; they were never variants.

**Why:** they were copy-pasted pages (718-line diff against their light
twin) shipping to production as `noindex`, ~1,750 lines to keep in sync
and 54 extra image variants per build, for a design review that has
happened.

**Reopen if:** a dark treatment is wanted for one of the Creative
Blueprints — build it as a `theme` prop on the one page, not a second file.

### 20. GSAP Draggable + InertiaPlugin load lazily, everywhere

**Decided:** `createDragCarousel` observes its track and `import()`s the
two plugins only when the track comes within 400px of the viewport; until
then the row is the plain native scroller it already was (same layout,
scroll-snap and prev/next buttons). `LogoMarquee` does the same for
`horizontalLoop` at 600px. `pressCards` moved to `src/lib/pressCards.ts`
so the add-on marquees, which only wanted the scale tween, stop pulling
the plugins in through it.

**Why:** the plugins are ~40KB and were the single longest task on every
page with a drag row — 600–850ms on a throttled phone — for an interaction
that can't happen until the row is on screen. `SystemAddonsMarquee` already
did this (§13); it was the only one, and its `pressCards` import undid it.
No animation changed: the loop, the throw, the snap and the press are
identical once loaded.

**Reopen if:** a drag row is ever the LCP element itself — then load it
eagerly on that page only.

### 21. Security headers: a baseline, not a full CSP

**Decided:** `_headers` sends `X-Content-Type-Options`, `X-Frame-Options`,
`Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy`,
`Permissions-Policy` and HSTS (one year, no `includeSubDomains`) on every
response.

**Why:** there were none. A full `script-src` policy is deliberately not
set: the hero's viewport script and the JSON-LD are inline and the
analytics beacon is third-party, so a real policy needs nonces or hashes
threaded through the layout first — a CSP that has to allow
`'unsafe-inline'` protects nothing.

**Reopen if:** the inline scripts are given hashes (then add `script-src`),
or other `fesagency.pt` subdomains are confirmed HTTPS-only (then add
`includeSubDomains; preload`).

### 22. The contact form validates and reports errors client-side; `/contact/thank-you/` exists

**Decided:** `/contact/` carries a script that validates the three fields
with inline, field-linked messages, submits over `fetch`, follows the
Function's 302 (or a 2xx) to `/contact/thank-you/`, and on any failure
shows a retryable status with the email address as the way out. A honeypot
field (`website`) is in the form. `/contact/thank-you/` is built, `noindex`,
and excluded from the sitemap. Without JS the form posts natively.

**Why:** submitting used to end on a bare 404 (the endpoint doesn't exist
yet), and the contract in measurement.md needs the thank-you URL to exist
before the Function can 302 to it. The Function itself is still not built.

**Reopen if:** the Function returns structured field errors — then map them
onto the same slots instead of the generic failure message.

### 23. Share images come from each page's own hero or first picture

**Decided:** `BaseLayout`'s `ogImage` accepts an imported asset and renders
it to a 1200×630 JPEG at build time. The Systems pages pass their hero,
Careers its team photo, Agency its hero, a case study its first picture.
Home, Projects, Contact, Tech Refresh and the legal pages keep
`/og-default.jpg`.

**Why:** every page shared the same generic card. A crop of the page's own
art costs nothing to maintain; a designed per-page card would.

**Reopen if:** a designed OG set is produced — pass its paths as strings.

### 24. Breadcrumb and `sameAs` structured data

**Decided:** `SEO.astro` emits an Organization `sameAs` list built from
`socialItems`, and a `BreadcrumbList` on any indexable page two or more
levels deep, using `breadcrumbLabels` in `nav.ts` for intermediate crumbs
and the page title for the last. A path with an unlabelled intermediate
segment gets no breadcrumbs rather than wrong ones.

**Why:** the Systems sub-pages and case studies are exactly the URLs where a
result showing "Systems › Creative Projects Blueprint › Branding" beats the
bare path; the social profiles were already linked in three places and
should be one list.

**Reopen if:** a visible breadcrumb component is designed — drive both from
the same data.

### 25. The hero shader stops while covered, renders at 1.5x, and yields to reduced-motion

**Decided:** `Hero.astro` sets the `ShaderMount` speed to 0 once `scrollY`
passes the section's own height and back to 0.5 when it returns; caps the
library's pixel count at 1.5x the container's CSS area
(`RENDER_SCALE = 1.5`) instead of its default 2x minimum; and does not
mount WebGL at all under
`prefers-reduced-motion: reduce` or `Save-Data`, leaving the still up.

**Why:** the hero is `position: sticky`, so it never leaves the viewport
and the library's own IntersectionObserver pause never fires — measured at
scrollY 2500, fully covered, `isIntersecting: true` at ratio 1. The
fragment shader was drawing a 2048×1536 canvas on every frame of the whole
homepage scroll, under content that hides it, in competition with
ScrollTrigger and Lenis. Speed 0 halts the rAF loop outright. The heatmap
is blur passes over a soft shape, so the extra pixels resolve much less
than they would for a hard-edged shader. The still is frame 0 of the same
shader, so the reduced-motion visitor sees the same image for free.

`RENDER_SCALE` started at 1 — CSS pixels, which is *half* the linear
resolution of any 2x screen and a quarter of its pixels. Measured at
1440x900 CSS on a dpr-2 display: backing store 1440x900, device pixels
2880x1800, so 1.3 of the 5.2 megapixels the screen was showing. The
contour lines had been checked at 1x and read clean, but 1x is the floor,
not a neutral choice, and the softness was visible once looked for. 1.5
puts it at 0.75 of device linear for 2.25x the fragment work — 56% of what
a full 2 would cost.

**Reopen if:** frame cost on a mid-range phone says 1.5 is too much (the
gate is a measurement, not a feeling), or the shape gains genuinely
high-frequency detail and 2 starts to earn its 4x. Also if the hero stops
being sticky (the scroll gate becomes redundant, the library's own pause
takes over), or a design wants the heatmap to keep drifting while it is
covered — it is never visible then, so that would need a reason.

### 26. Entrance animations pre-hide from CSS under `html.js`, and don't replay on a bfcache restore

**Decided:** a two-line inline script in `BaseLayout`'s `<head>` sets
`class="js"` on `<html>` before first paint. Under it, `global.css` keeps
every `[data-anim]` element (and a reveal section's children) at
`visibility: hidden` until `motion.ts` adds `anim-armed` in the same frame
it writes the GSAP starting state. A CSS animation lifts the pre-hide by
itself after 2.5s (`PREHIDE_SAFETY_MS`) if the bundle never runs, and an
init that arrives after that skips the entrance for in-view elements
instead of snapping them to opacity 0. `lifecycle.ts` now passes
`{ restored }` to `onPageLoad` callbacks; `BaseLayout` skips `initMotion`
on a restore and no longer tears it down on `pagehide`.

**Why:** motion.ts rule 1 (hidden state from JS only) meant every full
navigation painted the page visible, then the entrance began with a snap to
opacity 0 — in dev, behind ~26 unbundled Vite modules, that read as "page
loads, then resets and animates". Back/forward did the same, because the
teardown restored everything visible and the restore ran the load-in
again. The `html.js` gate keeps the no-JS guarantee the rule was for.

**Reopen if:** LCP on the hero headline measurably suffers (it now lands
when the bundle runs, not at first paint — check `docs/status.md`'s
Lighthouse numbers after the next run), or `<ClientRouter />` comes back
(parked §15), where a swap fade would mask the flash and the pre-hide
could go.

### 27. Six new case studies added photo-less; one shipped as a placeholder

**Decided:** `shamir-portugal`, `anchorage-digital`, `subvisual`,
`data-makers-fest` and `blip-media-relations` were added to
`caseStudies.ts` from client-supplied docx copy, each as a single `media`
block (one placeholder `cover` image) followed by a single `text` block
holding every labelled passage from the source doc — not split across
several media/text blocks the way `we-want-you` alternates them, since
there is no photography yet to justify a rhythm. Two edits went beyond the
docx as given: Shamir Portugal's rail title drops the doc's trailing
"Portugal" (the client name above it already carries it — "Shamir
Portugal" / "Strategic PR Portugal" read as a typo), and Data Makers Fest's
`/projects/` card tag reads "Digital Communication System" even though its
case study's `systems` field is both systems it used, matching how the
card component only takes one `tag`.

A sixth entry, `blip-activation` (the mupis/paid-media brand activation,
distinct from the PR work in `blip-media-relations`), has no source copy —
`Blip.docx` only covers media relations. Marcelo asked for the `/projects/`
card to ship now with placeholder description text, and for the case study
page to exist with the cover placeholder and a `TODO(marcelo)` passage
marking the real copy as outstanding, rather than waiting. It is the one
entry marked `draft: true` (noindexed, added to `NOINDEX_PATHS` in
`astro.config.mjs`) since its content is a stand-in, not the client's own
words like the other five.

**Why:** the brief was "leave one block for the photo, add the text" for
every new project — grouping the labelled passages kept that literal
(nothing to split them around yet) and made six similarly-shaped case
studies mechanical to review against their source docs.

**Reopen if:** real photography lands for any of the five real case
studies — that's the moment to reconsider whether its passages should
split across multiple blocks the way `we-want-you`'s do. For
`blip-activation`: once the real campaign copy replaces the `TODO`, drop
`draft: true` here and its path from `NOINDEX_PATHS`.

### 28. Links are prefetched on hover, and prerendered where the browser can

**Decided:** `prefetch: { prefetchAll: true, defaultStrategy: 'hover' }` and
`experimental.clientPrerender: true` in `astro.config.mjs`. Every same-origin
link is fetched into the HTTP cache a beat into a hover (Astro's own prefetch
script, ~3KB, one per page). On Chromium the hover instead appends a
Speculation Rules `prerender` entry for that URL, so the destination is fully
rendered off-screen and the click lands on an already painted page. Safari
and Firefox fall back to the plain prefetch.

**Why:** measured on the production build served locally with everything
already cached, a navigation between two pages spent ~800ms between the
click and `DOMContentLoaded` — time the visitor spends looking at the
`data-anim` pre-hide. A prerendered page has already spent it. The site is
static and has no per-visit side effects (the analytics beacon is not wired
up; the contact form only posts on submit), so prerendering a page nobody
ends up visiting costs bandwidth and nothing else. `motion.ts` holds its
entrance until `prerenderingchange` (`whenActivated()`), which is what
makes a prerendered page safe: it activates as the untouched resting page
and the choreography starts then. Note it waits on *prerendering*
specifically, not on visibility — §30 explains why a plain hidden tab must
skip the entrance rather than wait for it.

**Reopen if:** analytics land and would count a prerendered page as a view
(the beacon has to check `document.prerendering` and wait for
`prerenderingchange`), or the site gains server-rendered routes with
per-request effects — prerendering those double-counts them.

### 29. Page-to-page transitions are the browser's cross-document view transitions, not the router

> **Superseded by §30.** Reverted in full: there is no `@view-transition`
> rule, no `html.vt`, no `.vt-nav`/`.vt-hero`, and no `transitionName` prop.
> Kept here because the reasoning below is still sound in isolation — what
> it missed is that the mechanism cannot coexist with a JS entrance, which
> is §30.

**Decided:** `@view-transition { navigation: auto }` in `global.css`. The
primary nav on every page carries `.vt-nav` (`view-transition-name:
site-nav`), the hero photograph shared by Agency, Systems and Tech Refresh
carries `.vt-hero`, and the three Creative Projects Blueprint cards carry
per-slug names matched by their sub-page's hero (SystemCard's
`transitionName` prop). The root cross-fades over 280ms and named groups
morph over 360ms; reduced motion keeps the atomic swap and drops the
animation. On `pagereveal` with a transition running, BaseLayout's inline
head script sets `html.vt`, which switches the `data-anim` pre-hide off and
makes `motion.ts` skip the in-view entrance — the fade IS the entrance, and
the below-the-fold reveals still fire on scroll. On `pageswap`, a page
scrolled past half a viewport drops its nav and hero names, so the snapshot
of a sticky hero that later sections already cover can't fly over the
content. Firefox does not implement cross-document transitions and
navigates exactly as before.

**Why:** §15 removed the router because nothing used a transition; the brief
now asks for the nav to stay put and the hero to persist between pages. The
native mechanism gives both with no JS, no router lifecycle and no loss of
bfcache — every component keeps its `onPageLoad`/`onPageUnload` pair as is.
Not done: making the CPB cards and their sub-page heroes request the same
image widths so the bytes match as well as the picture. The morph doesn't
need it, and the card's 33vw ladder is the right one for a card.

**Reopen if:** Firefox parity becomes a requirement, or a design needs
state to survive a navigation (the shader hero kept running, a playing
video) — those need `<ClientRouter />` with `transition:persist`, and §15
says how to swap the lifecycle helpers back.

### 30. No cross-document view transitions; the GSAP entrance owns navigation alone

**Decided:** §29 reverted. `@view-transition`, the `::view-transition-*`
rules, `html.vt`, the `pagereveal`/`pageswap` head scripts, the
`.vt-nav`/`.vt-hero` classes and SystemCard's `transitionName` prop are all
gone. The `data-anim` pre-hide is now unconditional under `html.js`
(`html.js [data-anim]:not(.anim-armed)`, no `:not(.vt)` branch), and
`motion.ts` decides per element whether an entrance would flash rather than
reading a class set by the browser.

Three changes came with it, each fixing something measured:

- **A background tab no longer renders blank.** `whenVisible()` parked
  `initMotion` on a promise while `document.hidden`, and the CSS pre-hide
  held every `[data-anim]` at `visibility: hidden` behind it. The 2.5s
  safety animation does not rescue this — an unrendered document advances
  no animation timeline — so a page opened with cmd-click or restored with
  a session sat completely blank until it was focused. Measured: a blank
  hero 16.6s after load. It now skips the entrance instead of deferring it
  (`entranceWouldFlash()`), so the page is simply there when you look at it.
- **Prerendering is waited on, visibility is not.** A prerendered document
  also reports `hidden`, but it is about to become the page someone is
  looking at, so `whenActivated()` holds init until `prerenderingchange`
  and the entrance plays on activation. That keeps §28 working.
- **Reveals no longer wait for the font.** `initMotion` ran one pass behind
  `document.fonts.ready`, so the whole page stayed pre-hidden until Aeonik
  resolved and then released at once. Reveals and slides move a box layout
  has already placed and need no metrics, so they run as soon as the DOM is
  parsed; only the split-text pass, which bakes in line breaks permanently,
  still waits.

**Why:** the site was running two entrance systems over one navigation —
the browser's cross-fade and the GSAP load-in — coordinated by a single
boolean computed in a race between `pagereveal`, `document.fonts.ready`, a
rAF and a 2.5s wall-clock deadline. They cannot be made to agree, because
the browser captures the incoming page's snapshot at its first paint and
the GSAP entrance cannot exist that early: whichever wins, the visitor sees
a seam. Reported from the live site as a hero title that appeared, vanished
for an instant and then animated in, and a nav that scaled and faded — the
second being `site-nav` cross-fading a white-logo-on-shader nav against a
dark-logo-on-photo one over 360ms while the page under it faded over 280ms.
The nav boxes are pixel-identical between `/` and `/systems/` (measured at
1440 and 1920), so the group never needed to morph at all.

Picking one system was the fix, and GSAP is the one that carries the
brand: the split-text hero and the staggered reveals are the site's
signature, and under §29 they were suppressed on exactly the navigations a
visitor makes most. Navigation speed does not depend on the transition —
§28's hover prerender already paints the destination before the click
lands, which is the thing the cross-fade was covering for.

Not done: no replacement page-to-page effect. A prerendered page arriving
with its own entrance is the effect.

**Reopen if:** a design genuinely needs a shared element to persist across
a navigation (a hero that must not re-enter, a playing video). That is a
`<ClientRouter />` + `transition:persist` job per §15, not a cross-document
transition — and it means giving up the entrance on those routes, which is
the trade §29 made without saying so.

### 31. The wordmark is inlined, not fetched

**Decided:** `src/components/Logo.astro` inlines the FES wordmark as an SVG
with a `variant` prop (`dark` = `#101010`, `light` = `#ffffff`), replacing
all 18 `<img src="/fes-logo-{dark,white}.svg">` call sites. The two files
had byte-identical path data and differed only in `fill`, so they collapse
into one component. Both stay in `public/` — SEO.astro points the
Organization structured data at `/fes-logo-dark.svg`, which needs a real
fetchable file.

**Why:** every page renders two wordmarks, the nav's and the mobile menu's,
and each was a separate request that had to land before the nav could
paint. In dev that is two conditional requests per navigation — measured at
~46ms each, starting 46ms in — which is the nav visibly redrawing itself as
you click through the site. Production's `_headers` caches them for a week,
so this mostly does not reach a repeat visitor, but a first view still
blocks the nav on two round-trips.

Inlined, the wordmark is part of first paint: nothing to fetch, decode or
revalidate. Measured after: 0 logo requests on both the homepage and
`/systems/`, rendered box unchanged at 77.73×44. The cost is ~3.6KB gzipped
per page for both copies — the second is nearly free (115 bytes measured),
because it is a verbatim repeat well inside the compression window. That is
the trade §16 already makes for stylesheets.

The brand hexes are carried over literally rather than mapped to theme
tokens: `#101010` is not `--color-ink`, and a logo is not a place to
discover that.

**Reopen if:** the wordmark gains detail and the path grows past a few KB
gzipped (an `<svg><symbol>` sprite referenced twice by `<use>` gets back to
one copy), or a third colourway appears that is not a flat fill.

**Not done:** the path data is unoptimised — 8.2KB for a wordmark, at four
decimal places on a 105-unit viewBox. Running it through SVGO would likely
halve it with no visible change, but that edits a brand asset and belongs
in its own pass, not smuggled into a performance fix.

### 32. Native scroll-snap is suspended per-gesture, not per-row

**Decided:** `src/lib/dragCarousel.ts` writes
`scroll-snap-type: none` / `scroll-behavior: auto` on `onDragStart` and puts
both back on `onThrowComplete` (or one frame after `onRelease`, when a press
produced no throw). It used to write them at attach time and restore them at
cleanup. Alongside it, `SystemProblemCards.astro`'s entrance tween now
suspends snap on the row for its own duration.

**Why:** the attach-time version quietly cost every drag row its CSS
scroll-snap for the rest of the page's life — the row came within
`LOAD_MARGIN`, snap went to `none`, and it never came back. GSAP's `snap`
only governs a *drag*, so a wheel or trackpad scroll (how most people move
these rows on desktop) left the cards resting wherever the scroll stopped.
Measured on Careers' "Feedback from previous team members" at 1440: the row
also failed to hold its own initial centring, resting at `scrollLeft` 100
then 844 where card 2's snap point is 744. With the suspension scoped to the
gesture it lands on 744 at load, on 1488 after a drag, and on 744 again
after a prev click.

The two snap models agree on where a card rests, which is what makes handing
control back safe: `nearestCardX` measures offsets *relative to the first
card*, and that is exactly what `snap-center` plus the track's leading
padding (Careers, homepage) and `snap-align: start` plus `scroll-padding`
(`SystemProblemCards`) resolve to. Nothing moves at the handover.

Restoring snap on `SystemProblemCards` exposed a second thing the old
behaviour had been masking: a scroll-snap *area* is the element's
**transformed** border box, so that row's `gsap.from(cards, { x: 160 })`
entrance made a mandatory-snap container re-snap every frame and chase the
sliding cards — `scrollLeft` measured climbing to ~150 before easing back,
and `from`'s immediate render put the cards at x:160 from page load, so the
row could sit scrolled off its first card while it waited to be scrolled
into view. Hence that tween's own guard, which cannot be left to the drag
helper: the drag plugins load lazily and may not have landed yet.

**Reopen if:** a row is added whose GSAP snap target and CSS snap position
genuinely differ (a peeking/centred layout that JS snaps to the edge of, say)
— then that row wants CSS snap off in its own stylesheet rather than toggled,
so the handover has nothing to disagree about.

### 33. The hero's mobile pan is gated on aspect ratio, not just width

**Decided:** `Hero.astro`'s `MOBILE_QUERY` is
`(max-width: 1023px) and (max-aspect-ratio: 3/5)`, and the mobile still's
`@media` block and preload `media` attribute carry the same pair. It used to
be `(max-width: 1023px)` alone.

**Why:** `MOBILE_OFFSET_X` (-0.2) pans the heatmap toward its left lobe, and
there has to be something to pan *into*. With a square texture, `cover` sizes
the image box to `max(width, height)`, so the only horizontal slack is
whatever the box is taller than it is wide. The vertex shader puts the
container's right edge at `0.5 * width/box - u_offsetX + 0.5` in texture
space, so the pan stays inside the texture only while
`width/box <= 1 - 2*|MOBILE_OFFSET_X|` — 0.6, a hero taller than 5:3. Past
that the trailing columns sample the texture's clamped edge, which is bare
blur margin from `toProcessedHeatmap`'s 375px padding. It painted as a flat
dark band down the right of the hero, hard-edged at exactly 80% of the width
(measured: seam at x=795/1000 at 1000x920).

Portrait phones sit at 0.42-0.56 and never saw it. What did was everything
*else* under 1024px: a tablet in portrait (0.75), any phone in landscape
(~2.2), and a half-screen or split-view desktop window — the last of which is
how it was found.

A binary gate rather than clamping the offset to the slack available, because
the still and the canvas have to stay the same image: `hero-still-mobile.webp`
is baked square with the offset already in it, and `background-size: cover`
re-crops it to reproduce the live render exactly at any aspect ratio (it
reproduces the band, too). A continuous clamp would need a still per aspect.
The cost is that framing jumps at 3/5 on a rotate or a window drag, which the
existing 1024px switch already did.

**Reopen if:** the pan grows past -0.25 or so, where 3/5 stops being the
right line and the whole thing is better served by a wider-than-square
texture; or if the stills stop being frame 0 of the same shader, which is
what forces the gate to be binary.

### 34. `slide-right` travels a share of the card, and drops snap while it does

**Decided:** `setupSlideRight` in `src/lib/motion.ts` starts each card at
`min(card.offsetWidth * 0.72, 560)px` instead of a flat `100px`, over 0.9s /
0.12s stagger / `power3.out`, and sets `scroll-snap-type: none` on the track
for the length of the tween (restored in `onComplete`, and in the cleanup so a
teardown mid-flight can't leave it off).

**Why:** two separate reasons the entrance read as a rubber band rather than
an arrival — reported as "só mexem e voltam à posição inicial".

The travel: the cards are 720px at the desktop reference, so 100px moved the
card 14% of its own width. It was already sitting in its slot when the tween
started and drifted the last fraction, which parses as a wobble, not as
something entering. 0.72 of the card width puts card 1 at x≈518 — measured
`translate(518.4px)` at frame 0, easing to 0 by ~700ms — and both tracks are
clipped (the track's own `overflow-x`, plus `overflow-hidden` on the section),
so it genuinely enters from the right edge instead of overhanging the page.
Sizing it off the card rather than the viewport keeps the same read on a
full-bleed phone card as on the 45rem desktop one.

The snap: a scroll-snap area is the target's *transformed* border box, and
both tracks are `snap-x snap-mandatory` with the cards as the snap targets.
So while the cards tween the scrollport keeps re-snapping to wherever they
currently are and drags the track along behind them, cancelling out part of
the travel — the longer the travel, the more it eats. `gsap.from` writes its
start state when the tween is created, so the suspend has to happen at
creation, not in `onStart`.

Careers sets `track.scrollLeft` to centre card 2 at init (see
`setupAlumniCarousel`) while snap is off; restoring `x mandatory` at the end
of the tween lands on the same offset it was already at (measured: 744 before
and after), so the handover doesn't jump.

**Reopen if:** the cards stop being the snap targets, or a track loses its
clipping — an unclipped track would show a 518px overhang. Note this is a
different mechanism from decision 32's per-gesture suspension: that one hands
snap back and forth with JS scrolling, this one is a one-shot for an entrance
that never repeats (`once: true`).

### 35. A static-assets `wrangler.jsonc` is back, but with no adapter and no `main`

**Decided:** re-added `wrangler.jsonc` at the repo root — just `name`,
`compatibility_date`, and `assets.directory: "./dist"`. No `main`, no
`@astrojs/cloudflare`, nothing in `astro.config.mjs` changes.

**Why:** decision 18 removed `wrangler.jsonc` on the assumption the live
target was Cloudflare Pages' native git integration, which uploads whatever
`npm run build` produces without needing a Wrangler config at all. The actual
project runs `npx wrangler deploy` as its deploy command (Workers-style, not
`wrangler pages deploy`) — the build log calls it "Worker Name: fes". With no
config file present, that command doesn't know what to deploy, so Wrangler's
non-interactive auto-setup decides this is a fresh Astro project and runs
`astro add cloudflare` on its own, reinstalling an `@astrojs/cloudflare`
version whose `renderForPrerender` import doesn't exist in Astro 7.2 —
`[MISSING_EXPORT] "renderForPrerender" is not exported by
"astro/dist/core/app/entrypoints/index.js"` — and the deploy fails on every
push. A config file with `assets.directory` set is enough for `wrangler
deploy` to just upload `dist/` and skip the wizard entirely; `_redirects` and
`_headers` inside it are read the same way Pages read them.

**Reopen if:** the Cloudflare project is ever recreated as classic Pages
(native git integration, no `wrangler deploy` step) — then this file is
inert but harmless, or can be removed. If a real server route appears, this
is also decision 18's "Workers with static assets" fallback already arriving
early — add `main` and the adapter back into `astro.config.mjs` too.
