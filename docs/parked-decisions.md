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

**Update:** the real `blip-activation` copy landed (tech recruitment across
Meta, Reddit, LinkedIn and eight-city outdoor). `draft: true` and the
`NOINDEX_PATHS` entry are gone, the `systems` field now lists Digital
Communication System alongside Creative Projects Blueprint (paid media is
that system elsewhere on the site), and the `/projects/` card description
was rewritten to match. The card `tag` is unchanged.

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

### 36. The primary nav marks the current page/section

**Decided:** added `isNavActive(pathname, href)` to `src/lib/nav.ts`
(`pathname === href || pathname.startsWith(href)`) and wired it into every
inline copy of the primary nav — `BaseLayout.astro`'s default header,
`Hero.astro`'s and `MobileMenu.astro`'s own nav, and the per-page
`hideHeader` nav block repeated on the legal pages, Contact, Projects,
Careers, Tech Refresh, and each Systems/Creative Projects Blueprint page (18
call sites in total). The active item renders in the same "on" color the
rest of the site already uses for a selected state (`text-ink` on light
navs, `text-white` on the dark hero/careers/CPB-hub navs and the mobile
menu, matching `FilterTab`'s ink/neutral-300 convention) and carries
`aria-current="page"`. `startsWith` rather than an exact match, so a Systems
sub-page (`/systems/creative-projects-blueprint/branding/`) still lights up
"Systems" in the nav. The homepage is unaffected — `/` isn't in `navItems`,
so nothing false-matches it.

**Why:** none of the 18 nav copies indicated the current page at all — every
link rendered identically regardless of route. Wayfinding ("where am I?")
failing on every page view is a bigger cost than the one-line-per-call-site
fix, and the active/inactive colors already existed elsewhere in the design
system; this only applies them here.

**Reopen if:** a design pass gives the nav a different active-state
treatment (underline, dot, weight change) — swap the one conditional class
in `isNavActive`'s 18 call sites, the comparison function itself doesn't
change.

### 37. Case study blocks get the sitewide `data-anim="reveal"` treatment

**Decided:** `src/pages/projects/[slug].astro`'s right-column blocks — each
media grid and each text-passage group — now carry `data-anim="reveal"`,
using the same `motion.ts` handler and `REVEAL` tuning (y:24, 0.8s, 0.08
stagger, `power2.out`, triggered at `top 85%`) as every other page.

**Why:** the case study template was rebuilt as the sticky-rail +
block-based layout (see the most recent commit) with no `data-anim`
anywhere in it — the one template on the site where the site's own motion
language was silent, so images and copy teleported in on scroll instead of
entering the way they do everywhere else. This wires markup into a handler
that already exists; it doesn't add a new animation path, so it inherits
reduced-motion (cross-fade, no travel) and the pre-hide/safety-deadline
behavior for free.

**Reopen if:** a case study's block rhythm is deliberately meant to feel
different from the rest of the site (unlikely — nothing in `caseStudies.ts`
suggests that) — then scope the attribute to specific block types instead
of all of them.

### 38. Contact form: eased invalid-border, and a spinner on submit

**Decided:** the three field wrappers in `src/pages/contact/index.astro`
gained `transition-colors duration-200` alongside the existing
`has-[[aria-invalid=true]]:border-clay-default` rule, so the border eases to
the error color instead of snapping. The submit button gained a small
`animate-spin` ring (`data-submit-spinner`, hidden by default) next to a
`data-submit-label` span; the script shows the spinner and swaps the label
to "Sending…" on submit, and reverts both on failure (success navigates away
before either matters). Under `prefers-reduced-motion: reduce` the spinner
stops rotating and pulses opacity instead (1.4s ease-in-out).

**Why:** this is the only lead-gen form on the site. An instant hard-cut to
a red border on blur reads as an alarm rather than a correction, and the
submit button's only feedback was a text swap — easy to miss on the site's
single highest-stakes click, with nothing to look at during the network
round trip before the page navigates to `/contact/thank-you/`.

**Reopen if:** the Pages Function starts returning structured field errors
(decision 22 already flags this) — the spinner/label wiring is independent
of that and doesn't need to change either way.

### 39. ProjectsFilter: filtered-out cards fade before they're hidden

**Decided:** `applyFilter` in `src/pages/projects/index.astro` no longer
adds `hidden` to a non-matching `[data-project-item]` in the same frame the
category changes. It adds `opacity-0` (the wrapper already carries
`transition-opacity duration-300` from `ProjectsGrid.astro`) and hides the
element 300ms later via a tracked `setTimeout`, matching the fade-in
duration the matching cards already use. A `Map<HTMLElement, number>` of
pending hide timers is cancelled per-item if the card is re-matched before
its timer fires (fast re-filtering), and the whole map is cleared in the
feature's teardown.

**Why:** matches faded in over 300ms while non-matches vanished on the
`hidden` class instantly — asymmetric enter/exit for what's visually the
same interaction. Without the pending-timer bookkeeping, clicking two
filters in quick succession could strand a card mid-fade or hide one that
had just been re-matched.

**Reopen if:** the grid moves to a layout where `hidden` cards still occupy
grid space (a CSS Grid collapse rather than remove-from-flow) — then the
timing can likely move to a single `transitionend` listener instead of a
matched-duration timeout.

### 40. Project card icon chip uses the 4px card radius, not `--radius-control`

**Decided:** the client-brand icon chip in `ProjectCard.astro`
(`variant="featured"`) switched from `rounded-[var(--radius-control)]` (8px)
to `rounded-[var(--radius-card)]` (4px), matching the thumbnail directly
above it. The token itself was not changed — `--radius-control` still reads
0.5rem and its ten other call sites (SystemCard, the addon carousels, the
careers/homepage arrow buttons, the testimonial portrait) are untouched.

**Why:** requested directly. The chip and the thumbnail are a single visual
unit stacked 16px apart, and two different corner radii inside one card read
as an inconsistency rather than a distinction. The global.css comment
deriving `--radius-control` cites "the 72px client-icon avatars" — a
different, larger element — so this 54px chip was never the shape that token
was calibrated for.

**Reopen if:** the chip grows substantially (past ~72px), where 4px starts
to look like an unintentional near-square rather than a deliberate one.

### 41. A featured card's internal gap is pinned below its grid's gap

**Decided:** `ProjectCard.astro`'s featured root went from `gap-6` (24px) to
`gap-4` (16px), and the homepage's two Selected Projects grids went from a
uniform `gap-7` to `gap-x-7 gap-y-12` (28px across columns, 48px between
stacked cards), with the row-1/row-2 flex wrapper matching at `gap-12`. The
resulting ratio is 3:1 — 48px between cards against 16px inside one.

**Why:** at 24px inside a card and 28px between cards, the ratio was 1.17:1,
below the ~2:1 that Gestalt proximity needs before the eye groups a caption
with the image above it. The section read as alternating bands of image and
text rather than six discrete cards, worst in the single-column mobile
layout where the gap is the only separator. Measured on the live page, not
inferred. `/projects/` inherits the component half of this fix and improves
from 1.17:1 to 1.75:1 below `lg`; its `lg:gap-y-20` was already healthy.

**Reopen if:** the card gains a third stacked element (a tag row under the
description, say) — then the internal rhythm needs re-deriving as a whole
rather than as one gap.

### 42. Selected Projects pays no bottom padding; Stats owns the gap

**Decided:** the Selected Projects `<section>` on the homepage dropped
`pb-[var(--space-section-y)]`. The gap to the Stats section is now supplied
solely by Stats' own `py-[var(--space-section-y)]`.

**Why:** the two paddings stacked into 240px at the 1440 reference and 192px
on a phone — double the section rhythm used everywhere else on the page, and
about a quarter of a phone screen of empty white between the last card and
"Our Impact". The section already declined to pay its own *top* padding for
the same reason (it runs `pt-[var(--space-gutter)]` because the Hero above
it owns that space); the bottom simply never got the same treatment. Safe
for the light-to-dark flip because `.invert-zone` paints
`background-color: var(--color-surface)` and the section's own `bg-surface`
tracks the same token, so the removed band was never a distinct color.

**Reopen if:** Stats stops being the section that follows Selected Projects
— the next section has to be checked for its own top padding, since this
one no longer contributes any.

### 43. Featured card meta row: centered icon, one description size, wrapped title

**Decided:** three related fixes to `ProjectCard.astro`'s `variant="featured"`
meta row (icon + title + description), all in the same block since they're
the same row:

- The icon/text flex row switched from `items-start` to `items-center`.
- `featuredDescriptionClasses.lg` dropped its `lg:text-body` escalation, so
  both size tiers now render description copy at a flat `text-body-sm`.
- The title switched from `truncate` (single-line ellipsis) to
  `line-clamp-2`.

**Why:**
- *Alignment* — `items-start` pinned the icon's top edge to the text
  block's top edge, but a 1-line vs 2-line description changes the text
  block's height by a full line, so the icon's bottom edge landed anywhere
  from +3.5px to -6.1px off the text's own bottom depending on which card.
  Centering keeps the icon's optical weight balanced regardless of
  description length, and needs no per-card exception.
- *Type collision* — at the 1440 reference, the large row's description
  (`text-body-sm lg:text-body`) and the small row's title (`text-body`)
  both resolved to 17.4px: two elements playing different roles landing on
  an identical size by coincidence, which read as the two rows "arguing"
  rather than sitting in one hierarchy. Pinning descriptions to
  `text-body-sm` at every breakpoint removes the collision; title vs.
  description is still legible as weight (`font-medium` vs `font-normal`)
  and color (`text-ink` vs `text-ink-muted`), the same distinction the
  small tier already relied on alone.
- *Truncation* — `truncate` clipped "Startup Portugal | Social Media
  Boost" mid-word at 1440px. A clipped client name in the site's flagship
  project showcase is a worse failure than a second line. `line-clamp-2`
  rather than an unclamped wrap, so one unusually long title still can't
  grow a card taller than its row-mates.

**Reopen if:** a future title needs 3 lines to read (raise the clamp and
re-check the card's `min-h`), or a design pass wants title/description
distinguished by size again — then the two need a size *gap* wide enough
that neither tier's title and the other tier's description can land on the
same computed pixel value at any viewport between 375 and 1920.

### 44. FixedNav: pinned mobile Menu trigger only, homepage-only, declared ink over `mix-blend-mode`

**Decided:** a new `<FixedNav />` component (`src/components/FixedNav.astro`
+ `src/lib/fixedNav.ts`) replaces the homepage's mobile Menu trigger. The
logo is deliberately NOT part of it — by explicit user decision after an
earlier version of this pilot pinned both together. The logo stays in
`Hero.astro`'s own in-flow `<nav>`, scrolling away with the sticky hero
exactly as it always did, and does not reappear on scroll-up; only the
trigger gets the treatment below.

- The trigger is `position: fixed` (pinned over the whole page, not just
  the hero), instead of scrolling away with `Hero.astro`'s sticky section
  as it did before.
- Its color is **declared per section**, not computed from the pixels
  underneath. Each section carries `data-nav-ink="light"|"dark"`; a thin
  1px probe line at the trigger's own vertical centre — not a band the
  height of the trigger — picks up whichever section is actually behind it
  via `IntersectionObserver`. The homepage's `.invert-zone` (Selected
  Projects + Impact, see #14 in this doc's era for the original inversion)
  carries no static attribute at all: it's read live off its own
  `--dark-progress` instead, both on its internal flip and on re-entering it
  from either edge, because a static "entering" value gets scrolling back UP
  from "What we do" into the zone's bottom wrong (see the comment on
  `[data-invert-zone]` in `index.astro` and on `zoneUnderNav` in the same
  file for the two bugs this caught: `onRefresh` firing from unrelated
  sitewide ScrollTrigger refreshes and pushing stale ink, and a loose
  rootMargin flipping the ink ~90px before the zone's edge actually reached
  the trigger).
- The trigger renders as a **filled chip** — solid box in the declared ink,
  label in its inverse — rather than the frosted `bg-neutral-950/60
  backdrop-blur-lg` pill every other page's header still uses, and auto-hides
  past 10px of downward scroll, reveals on 7px of upward movement.

Scoped to **mobile only** (`lg:hidden`) and the **homepage only**. Desktop's
nav is untouched — still `Hero.astro`'s own inline `<nav>`, unpinned,
scrolling away with the sticky hero exactly as before.

**Why:** this followed a working session that prototyped four alternatives
on a standalone comparison page (`src/pages/styleguide/nav-experiments.astro`
— kept as a live reference) — `mix-blend-mode: difference`, a hybrid
transparent/blend-then-solid, an outlined declared-ink chip, and this filled
one. Blend-mode measured muddy over both the site's own case-study
photography and the brand's saturated accent purple (`#4A40F2` differenced
against white came out an odd olive tint, not a clean invert); the declared
mechanism doesn't have that failure mode because nothing is computed from
the pixels — the tradeoff, accepted here, is that every section needs an
explicit opinion. Mobile-only and homepage-only because the entire
prompting session was scoped to mobile, and every other page still
duplicates BaseLayout's header markup inline (18 copies) rather than
importing a shared component — extending this further is real work per
page, not a flag flip. Trigger-only (not the logo) is a brand-legibility
call, not a technical one: the wordmark reads as identity and is fine
disappearing with the hero the way it always has, while the trigger is a
control the visitor may want reachable at any scroll position.

**Reopen if:** rolling this out to another page, or to the logo. Two things
don't generalize yet and will need to: `FixedNav.astro`'s `--dark-progress: 1`
default (light ink) is hardcoded on the assumption that page's top section
is dark, exactly true for the homepage hero and not necessarily true
anywhere else — it needs to become a prop. And `lib/fixedNav.ts`'s generic
observer assumes every `[data-nav-ink]` section is a plain, static,
non-`position:sticky` block; a second sticky section on a future page would
need the same "only push when actually under the nav" guard `zoneUnderNav`
gives the homepage's invert-zone, not a bare `data-nav-ink` attribute (a
sticky element's `getBoundingClientRect()` reports its pinned viewport
position forever, so a generic boundary-crossing observer treats it as
permanently intersecting once first read).

### 45. Button type stays `text-body-sm`; padding carries the emphasis instead

**Decided:** `Button.astro`'s no-arrow path went from `py-1.5` to `py-3`, and
the two callers that had bumped it to `!text-body` (`index.astro`'s "Meet the
Agency" and `SystemsWhatWeDo.astro`'s "Our systems") had that override
removed, reverting both to the component's default `text-body-sm`. Also
added: an explicit `duration-150 ease-out` on the press/hover transitions
(previously relying on Tailwind's un-stated defaults), a `group-hover`
nudge (`translate-x-0.5`) on the arrow chip, and the `active:scale-[0.97]`
press feedback `Button.astro` already had, now matched on `ScrollCta`'s
"Book a call" pill, which was missing it entirely.

**Why:** requested directly, comparing "Book a call" (`ScrollCta.astro`,
`text-body-sm` + `py-3`) against "Meet the Agency" / "Our systems"
(`Button.astro`, arrow removed but padding never re-tuned for the lost
chip, then compensated with a larger type override). The chip's own 28px
height was carrying the arrow variant's presence; strip the chip and 6px of
vertical padding reads thin next to everything else on the page. Sizing the
label up masked that but broke consistency with both the arrow variant and
"Book a call" — three CTAs, three different type sizes doing the same job.
14–15px is already this site's established UI/button size (it's what the
arrow variant and "Book a call" both ship with, and it's the size Stripe,
Linear, and Vercel converge on for buttons generally); the fix restores it
everywhere and gives the no-arrow path the same generous padding "Book a
call" already had, rather than growing type to compensate for cramped
padding.

**Reopen if:** a genuine primary/secondary two-tier button system gets
built — at that point the primary tier may deliberately want more visual
weight than `text-body-sm` + `font-medium` gives it, and that weight should
come from a real second variant, not a per-instance override.

### 46. `horizontalLoop`'s drag responds to trackpad two-finger swipes, not just click-drag

**Decided:** `src/lib/horizontalLoop.ts`'s `draggable: true` path (the
Addons carousel/marquee on Systems and Blueprint pages, and `LogoMarquee`)
now also attaches a `wheel` listener on the same trigger element. GSAP's
`Draggable` only ever sees pointer/touch input — a trackpad two-finger swipe
fires `wheel` events instead, which `Draggable` has no notion of, so the
strip sat dead under a trackpad even with dragging "on." The listener only
acts when a gesture is horizontally dominant (`|deltaX| > |deltaY|`, so a
vertical page-scroll wins over the strip), scrubs the same timeline
`Draggable`'s own `align()` does (shared `ratio = 1/totalWidth`, same sign),
and — since `wheel` has no down/up pair, just a burst of deltas — settles
with its own 120ms-idle debounce that tweens to the nearest card via
`tl.tweenTo` and resumes autoplay if the gesture paused it. Cleaned up
alongside the rest of the draggable setup in `destroy()`.

**Why:** reported directly — trackpad dragging "not working like that" on
the addons strips. `dragCarousel.ts`'s rows (Testimonials, Careers, Agency
team) never had this gap because they're real `overflow-x: auto` elements,
where a trackpad swipe is native browser scrolling the OS already handles;
`horizontalLoop.ts` has no scroll container at all — every card position is
a transform driven by `Draggable`'s proxy — so trackpad support had to be
built by hand.

**Reopen if:** GSAP's `Observer` plugin (bundled with core since 3.10, not
currently used anywhere in this repo) becomes the project's general answer
to input normalization for some other reason — at that point this
hand-rolled listener could fold into it instead of staying a one-off.

### 47. "Sound familiar?" cards are text-only on every Systems page, with an eased scrim

**Decided:** `SystemProblemCards` no longer has an image slot. Influence &
Reputation was the only page passing photos (`card-1-experts.jpg` …
`card-4-narrative.jpg`); those imports are gone, and the other Systems pages
lose their neutral-700 "photo not shot yet" placeholder, so every page now
renders the same flat neutral-900 card. The top scrim stays black-to-
transparent but peaks at 0.3 alpha (was 0.5) and follows an ease-in-out
curve (16 sampled stops) instead of a two-stop linear fade, which on a flat
card showed a visible band where the alpha stopped changing. A faint
static SVG-noise grain (`overlay`, 0.18) sits over the scrim as a dither:
the fade only spans ~6–7 8-bit grey levels on neutral-900, so without it
each level renders as its own horizontal band.

**Why:** requested directly — one treatment across all Systems pages, same
gradient, subtler, eased.

**Reopen if:** photography is commissioned for the problem cards again. The
old `<Image>` slot (860×916, `sizes="(min-width: 1024px) 28vw, 80vw"`) is in
git history; the source JPGs are still in
`src/assets/systems/influence-reputation/`.

## Motion tuning pass (2026-09-22)

### 48. Reveals fire per item on the homepage, on one house curve, and the stats wait to be seen

**Decided:** a motion audit direction of "quiet & editorial", trialled on the
homepage before a sitewide rollout:

- **Per-item reveals.** `motion.ts` gained `data-reveal="items"`, an opt-in
  on a `data-anim="reveal"` section. Each item enters on its own scroll
  position (`ScrollTrigger.batch`, `top 90%`) instead of the whole section
  going off at once; a grid marked `data-reveal-each` breaks into its
  children. Tuning is quieter than the section reveal — y 16 (was 24),
  0.6s (was 0.8), 60ms stagger, the house curve. Every homepage reveal,
  the hero paragraph and `SystemsWhatWeDo` (via its new `revealItems` prop)
  opt in; every other page still runs the old section-level reveal.
- **One house curve.** `--ease-out` is now `cubic-bezier(0.23, 1, 0.32, 1)`
  in `@theme`, overriding Tailwind's stock `(0, 0, 0.2, 1)` — so every
  `ease-out` utility sitewide picks it up (tokens can't be page-scoped).
  GSAP code imports its twin, `EASE_OUT` (`power4.out`, same quint-out
  shape, no CustomEase bytes), from `src/lib/ease.ts`. FixedNav's
  hand-typed `cubic-bezier(0.22, 1, 0.36, 1)` points at the token now.
- **Exits start fast.** UnderlineLink, MobileMenu and ScrollCta exits went
  from `power2.in`/`power3.in` to `EASE_OUT`, and shorter (underline
  retract 0.35→0.2s, menu close 0.3→0.2s, CTA hide 0.3→0.2s). The underline
  draws in 0.3s (was 0.45) — it's a hover, hit constantly.
- **Stats cycle waits to be seen.** The homepage stats rotation (1800ms,
  unchanged — user decision) starts from stat 1 when the list is half in
  view and pauses, progress bar included (`data-paused`), when it isn't.
- **Project card hover zoom** `scale(1.01)`/700ms → `scale(1.03)`/500ms.

**Why:** measured at 1440×900, a section's single `top 85%` trigger fired
with only 12–27% of the section on screen, so the project cards and system
cards finished their entrance below the fold — visitors scrolled onto
content that was already still, and the only visible motion was a whole
grid sliding as one slab. With per-item triggers, entrances start with the
item 77–87% down the viewport. The stock ease-out made everything drift
rather than arrive, and the ease-in exits lingered at the exact moment the
visitor wanted the thing gone. The stats cycle started at page load, a
viewport and a half above the section, so visitors arrived mid-lap, and it
kept ticking beside the "Behind these numbers" paragraph indefinitely.

**Settled decisions left alone:** pinned choreography stays desktop-only
(§1), the approach stepper keeps its snap (§4), the invert zone's flip
stays unscrubbed, testimonials keep `slide-right` (§34), no page
transitions (§30), the 1800ms stat timer.

**Rollout:** add `data-reveal="items"` (and `data-reveal-each` on card
grids) to the other pages' reveal sections — or, once every page has it,
make it the default and delete the section-level path in `setupReveals`.
The Systems components' own GSAP eases (`SystemProblemCards`,
`PhasesScroll`, `BuiltForRotator`, `SelectedProjectsRotator`) still use
their own `power*` strings and should move to `EASE_OUT` in the same pass.

**Reopen if:** the per-item cadence reads busy on a long page (raise
`REVEAL_ITEMS.stagger` or drop `data-reveal-each` from that grid), or the
client wants a more expressive motion personality than "quiet & editorial".

### 49. The hero recedes under the page (the lead-project unveil was tried and dropped)

**Decided:** two additions on top of §48, both homepage-only:

- **Hero depth.** `Hero.astro` gained a `data-hero-dim` layer (flat
  neutral-950, above everything in the hero) scrubbed from 0 to 0.6 opacity
  over the hero's own height of scroll, while the copy block
  (`data-hero-copy`) drifts up 6% of that height. Plain numeric start/end
  (0 → `section.offsetHeight`) because the hero is sticky, and a sticky
  element's measured position depends on when it's measured. Skipped
  entirely under reduced motion.
- **Unveil.** `ProjectCard` takes `reveal="unveil"` (featured variant),
  used on the two large cards in the homepage's first Selected Projects
  row. Inside a `data-reveal="items"` section, the cover opens from the
  bottom edge up (`clip-path: inset(100% 0 0 0)` → `inset(0)`, 1s) while
  the photo settles from `scale(1.08)` (1.4s), and the caption follows
  0.2s later with the ordinary item fade-and-rise. The <img>'s own CSS
  hover transition is switched off inline for the length of the entrance
  and handed back on complete, with the clip and transform.

**Why:** the sticky hero was being covered with no cue that the page is a
layer sliding over it — the footer reveal already says this at the other
end of the page, with the same dark layer and drift. The unveil is kept to
two cards on purpose: the direction is "quiet & editorial", and six
curtains in a row would be busy; the two large covers are what the section
is built around.

**Update, same day — unveil removed.** Reviewed as "maybe too much", and
it was: once the manifesto beat (§50) became the homepage's signature
moment, a second theatrical reveal three sections above it diluted both.
One signature per page. The `reveal="unveil"` prop and motion.ts's unveil
code were deleted rather than left unused; the description above is the
spec if it's ever wanted again.

**Reopen if:** the dim reads heavy against the white sheet on a real
display (lower `DIM_MAX` in Hero.astro).

### 50. The Our Impact section stays quiet: no manifesto beat, no stats rise

**Decided:** tried and reverted the same day. Two additions were built for
the homepage's Our Impact section — the "Behind these numbers" paragraph
entering line by line and then lighting "PR", "brand", "digital" and
"events" one at a time before joining them on "one system"; and the six
stat numbers rising out of masks, with the stats cycle waiting for them to
land. Both came out. The section keeps §48's per-item fade-and-rise, and the
stats cycle stays its only ongoing motion.

**Why:** reviewed on the page as too much. The section already carries a
cycling highlight next to a large block of display text; a second and third
layer of motion made it confusing rather than meaningful, and the reading
suffered. The lesson generalises: a section with continuous motion gets no
additional entrance choreography.

**Kept from the attempt:** two generic rules in `setupItemReveals` — an item
carrying its own `data-anim` is skipped (it has its own entrance), and a
marked group nested inside a `data-reveal-each` grid opens up too.

**Reopen if:** the stats cycle goes, freeing the section's motion budget —
the beat was the only option mocked up where the motion carried the
sentence, so it's the one to revisit.

### 51. "What we do" heading caps in em, and balances

**Decided:** `SystemsWhatWeDo`'s "Strategic systems built around the
business challenges that matter most" went from `max-w-[50.8125rem]` to
`max-w-[18em] text-balance`.

**Why:** `text-h1` grows with the viewport but a rem cap doesn't, so at 1440
the balanced second line (~16.7em) stopped fitting in 813px and "most"
dropped to a line of its own. Capped in em, the ratio holds at every width:
two lines breaking after "the" at 1920, 1440, 1024 and 768 (measured), and
four balanced lines on a 375 phone, where two can't fit. Applies on
`/systems/` too — same component.

**Reopen if:** the copy changes length; 18em assumes a sentence of roughly
this size (it needs ~32em on one line).

### 52. The Agency nav logo spells itself out once per session, desktop only

**Decided:** on `/agency/` only, the nav's `<Logo>` became
`AnimatedLogo.astro`: the motion master (`site_fes-logo-motion.mp4`, "FES"
→ "FILLING EMPTY SPACES agency" → "FES") plays once, ~600ms after the page
is visible, then hands back to the static SVG. It is multiply-blended over
the hero photo (the clip is black on white, not transparent), and the
Agency hero `<nav>` lost its `z-10` so the blend has the photo to blend with.

- **Once per browser session** (`sessionStorage`), marked on `playing`, so a
  visit that saw it never sees it again that session; a bfcache restore
  never replays it; a hidden tab or an unactivated prerender waits until
  someone is looking instead of spending the one play.
- **Desktop only** (`lg`, 64rem+). Opened, the name is ~7× the logo's width
  (~555px at the 44px logo) — it clears the nav links at 1024 and up, but on
  a phone it would be cut off by the hero's `overflow-hidden`. Scaling it
  down doesn't work: the opening "FES" would no longer land on the static
  logo.
- **Held name shortened from ~5.7s to ~2.5s** (10s → 6.7s total): three
  words read in under two seconds, and the hold was competing with the h1.
  The cut is between frames 210 and 376, which are identical, so it's
  invisible.
- **Not played** under `prefers-reduced-motion`, without JS, if autoplay is
  refused, or if the 80KB clip isn't ready within 3s. All of these leave the
  static logo in place, which is what the link carries for assistive tech in
  every case.

**Why:** user request — the animation's first and last frames are the logo,
so a single run that settles back onto it reads as the mark introducing
itself rather than as a looping ornament. Video over Lottie: one animation
doesn't justify a 40–60KB player, and the hand-off to the vector SVG at the
end means the resting state is always crisp anyway.

**Reopen if:** the motion designer delivers a mobile cut (e.g. stacked) or
an alpha-channel export (WebM/HEVC) — alpha would drop the multiply trick
and its light-ground-only constraint; or the logo goes anywhere else,
which needs its own width check against that page's nav.

### 53. The homepage gets the logo motion too, sharing §52's one play per session

**Decided:** the homepage hero's `<Logo variant="light">` became
`<AnimatedLogo variant="light" delay={1400} />`, and its `<nav>` lost its
`z-10` for the same stacking-context reason as §52. One `sessionStorage`
key covers both pages: whichever the visitor opens first plays it, and the
other shows the static logo.

- **Its own clip, `fes-logo-motion-light.mp4`**: the master inverted in RGB
  (white on black), `screen`-blended over the shader. No new export needed —
  the master is pure black on white, so inverting it loses nothing.
- **Both clips now clamp their grounds** (≥240 → pure white/black before
  encoding). The master's white decodes at 253, not 255, which inverted to a
  2/255 ground, and `screen` over the dark gradient showed that as a visible
  box. The Agency clip had the same 1% error under `multiply`, fainter; both
  are now exactly Y=235/16.
- **1400ms after fonts are ready**, not §52's 600ms: the h1's line entrance
  (motion.ts SPLIT: 0.15s delay + 0.9s + 0.07s stagger per line) lands
  first, so the headline and the logo never move at once. The delay
  counts from `document.fonts.ready` on both pages now.

**Why:** the homepage is most visitors' first contact and where "FES" is
least explained — the motion spells the name out without a word of copy.
The hero already runs a shader and a split-text entrance (the §50 lesson:
don't stack entrance motion on top of continuous motion), hence the
sequencing; a separate once-per-page key would show it twice in one visit
(home → Agency), and the second time it's just decoration.

**Reopen if:** the h1 entrance is retimed (the 1400ms follows SPLIT by
hand), or analytics show most sessions starting on Agency, in which case
the shared key already does the right thing, but the Agency delay may want
the same headline-first sequencing.

### 54. `/api/contact` and `/go/booking` are a plain Worker, not the Cloudflare adapter; leads land in KV

**Decided:** `wrangler.jsonc` gained `main: "./worker/index.ts"` and a
`LEADS` KV binding. `worker/index.ts` is a hand-written Worker fetch
handler — no `@astrojs/cloudflare`, no change to `astro.config.mjs`'s
`output: 'static'`. It owns exactly two routes (`POST /api/contact`,
`GET /go/booking`) and falls through to `env.ASSETS.fetch()` for
everything else. On a valid contact submission it verifies Turnstile,
sends via Resend to `hello@fesagency.pt`, writes a `lead:<uuid>` record to
`LEADS` KV (timestamp, name, email, message — the fields
docs/measurement.md §Server-side counts asks for), then 302s to
`/contact/thank-you/`. A failed Resend send returns a 502, deliberately
never redirecting to the thank-you URL. A same-IP submission is
rate-limited to 5/hour via a `ratelimit:<ip>` KV key with a 1-hour TTL.
`/go/booking` 302s to the Google Calendar link that was already live in
`ScrollCta.astro` — open question #4 in the roadmap turns out to already
be answered in the markup, just not routed through the indirection yet.

**Why not the adapter:** §35 exists because `@astrojs/cloudflare` broke
this exact build once (`renderForPrerender` missing from Astro 7.2's
exports) and the project has run without it since. Re-adding it to get one
POST route back would reintroduce that whole failure class for a handler
that's ~150 lines of `fetch`/`Response`. A plain Worker gets the same
`env.ASSETS.fetch()` fallback the adapter would have given, with none of
its build-time coupling to Astro's internals.

**Why KV over the alternatives:** free, already provisioned by adding one
binding, and this form's volume (an agency contact form) never approaches
KV's read/write limits. A flat file isn't an option (Workers have no
filesystem); a database is more than this needs unless the roadmap's
future Supabase migration happens anyway, at which point the log write
moves there too.

**Why the Worker is excluded from the root `tsconfig.json`:** it needs
`@cloudflare/workers-types` (a `Request`/`Response`/`FormData` surface
that collides with the DOM lib the Astro pages use), so it gets its own
`worker/tsconfig.json` instead of widening the root config's ambient
types for the whole project.

**Sender is `noreply@fes.agency`, recipient `hello@fesagency.pt`:** the
domain verified in Resend is `fes.agency`, and only the sender's domain
needs verifying. Replies go to the visitor via `reply_to`.

**Turnstile keys:** the real site key is public, so it's hardcoded as the
default in `contact/index.astro` (no build variable to forget in CI).
`npm run worker:dev` overrides it with Cloudflare's always-pass test site
key, and `.dev.vars` holds the matching test secret, because the real key
only renders on the widget's registered hostnames. `npm run deploy`
always rebuilds, so a test key left in `dist/` can't ship.

**Reopen if:** a second server route needs something the adapter would
give for free (streaming SSR, Astro middleware) — until then this stays
the simplest thing that answers one POST and one redirect. Also reopen the
KV choice if lead volume or query needs ever exceed "read the log back by
hand", and the sender if `fesagency.pt` is ever verified in Resend.

### 55. No consent banner: nothing loads that needs one; the legal pages are an inventory of what the site really does

**Decided:** the site ships without a cookie/consent banner, and keeps it
that way by never loading anything that needs consent before the visitor
asks for it:

- Tech Refresh's Spotify and YouTube iframes became click-to-load facades
  (`data-embed-facade`); the Podcast & Video Series page already had one.
  All YouTube embeds use `youtube-nocookie.com`.
- Cloudflare Web Analytics is cookieless; Turnstile and Cloudflare's
  `__cf_bm` are security measures, exempt as strictly necessary.
- The only first-party storage is `fes:logo-motion-played` in
  sessionStorage (§52–53) — no personal data, gone when the tab closes, and
  disclosed by name in the Cookies Policy.

The Privacy and Cookies policies were rewritten from the 2024 template to
describe this stack: the Mailchimp newsletter section, the "accept via our cookie notice" promise, the advertising
cookie category, the `#` "Cookie Notice & Compliance" link and the Internet
Explorer instructions are gone; Turnstile, Resend, the KV lead log, Google
Calendar booking, the Google Forms careers application and the newsletter
are in, each with its lawful basis and retention. The newsletter is the
Brevo-hosted signup form (`sibforms.com`), linked from the footer in a new
tab — not Mailchimp as the old policy said. Consent is collected on Brevo's
form, not on this site, so the site itself still stores nothing; the
signup form's own consent wording lives in Brevo and is checked there. Controller name is **Press Play,
Unipessoal, Lda.** (checked against the NIF 513 906 169 registry entry —
the cookies page said "PressPlay").

**Retention periods chosen here, not in the brief:** contact requests and
bookings 2 years; job applications 12 months. The contact one is enforced
in code — `LEAD_RETENTION_SECONDS` in `worker/index.ts` sets a KV
`expirationTtl`, so the log deletes itself. The mailbox copy, Google
Calendar and Google Forms are deleted by hand; nothing automates those.

The contact form gained an art. 13 notice under the submit button — a
notice, deliberately not a consent checkbox: the basis for replying to a
message is art. 6(1)(b), and a checkbox would imply consent is what's
relied on.

**Why:** a banner is only required for non-essential storage; a site that
has none is both compliant and faster, and "no banner" is itself a trust
signal for an agency. The old template described a site that didn't exist,
which is its own GDPR problem (art. 12–13 transparency).

**Reopen if:** any analytics, pixel, chat widget, or embed that loads
without a click is added — at that point the site needs a real consent
mechanism (prior blocking, reject as easy as accept) *and* the Cookies
Policy inventory updated. Also reopen if the newsletter signup moves
onto the site (an embedded Brevo form loads Brevo's scripts and may need
click-to-load or consent), if the retention
periods are changed (change the Privacy Policy and the Worker constant
together), or if a lawyer's review changes the wording.

### 56. Three carded projects get their case studies; Natixis's intro follows the docx

**Decided:** `start-campus`, `startup-braga-10x-forward` and
`sim-conference` were added to `caseStudies.ts` from the client-supplied
docx copy, in the same shape as §27 (one placeholder `cover` media block,
then one `text` block with every labelled passage, verbatim). These three
already had cards on the homepage and `/projects/` pointing at their slugs,
so until now those cards 404'd. The slugs follow the existing card hrefs,
not the client names — `sim-conference` holds the Startup Portugal case
study, whose rail reads "Startup Portugal / Social Media Boost & SIM
Conference" as the docx titles it. The other ten docx case studies (AI
Impact on History Study, Bridge In, Coverflex, Darede, Dashlane, New Work,
Orla, STCP, Tech Refresh, Uphold) were deliberately left out on Marcelo's
call.

In the same pass, `we-want-you`'s two intro paragraphs were replaced with
the Natixis docx's wording (the old copy called Natixis "a French
investment bank" and its second paragraph was unfinished), and the Shamir
Portugal card's icon was corrected from Coverflex's icon to
`Shamir-icon.png`.

Each of the three uses its `/projects/` card thumbnail as its `cover`
(copied into `src/assets/case-studies/<slug>/cover.png`), so the pages
aren't all placeholder while real case-study photography is pending. The
Startup Portugal photo is roughly 5:4, so the 3/2 cover well crops a little
off its top and bottom. `blip-media-relations` (from §27) got the same
treatment from `Blip-media-relations.png`; `blip-activation` has no card
photo, so it stays a placeholder.

**Why:** the docx is the client-approved source; everywhere else the case
studies already quote it verbatim.

**Reopen if:** photography lands for these three (split the single text
block into a media/text rhythm like `we-want-you`), or the remaining ten
case studies are greenlit.

### 57. Project image grids use a tighter, fluid column gap (12 → 16px), not Figma's 28px

**Decided:** a new token, `--space-grid-gap` (12px at 375, 16px at 1440,
restated as `1rem` in the zoom tier), now sets the column gap of every grid of
project image tiles: both homepage Selected projects rows, the `/projects/`
grid (`ProjectsGrid.astro`) and the podcast-video-series strip. Row gaps are
untouched (`gap-y-12` on the homepage, `gap-y-20` on `/projects/`, 28px
stacked on mobile).

**Why:** the fixed 28px (Figma 770:947) was drawn for a fixed set of columns.
Once the page margin went fluid (31px at 1440, 24px at 1024), the gap sat
level with the margin, and on narrower screens wider than it, so the margin
no longer framed the group. Compared side by side on the live pages at 1440
and 375: at 16px the six homepage cards read as one body of work, and the
2-up and 4-up rows still share a centre gutter because they share the token.
The mobile strip shows enough of the next card for its title to be read,
which is a clearer swipe cue. 12px was tried on desktop and rejected: in the
4-up row one card's description almost runs into the next card's icon chip,
so the captions set the floor, not the 4px corner radius.

Deliberately NOT extended to: filled CTA panels (`DualCta`, the careers and
contact cards), two-column text layouts (`lg:gap-7` beside section
headings), or the stats grids. Those are about reading measure and separating
choices, not grouping images.

**Extended to `SystemCard` grids** (the blueprints index and
`SystemsWhatWeDo`): they are image tiles too, and at 28px they would read as
following a different rule from the project grids. Unlike project cards they
use the token on BOTH axes: their text sits inside the image, so there is no
external caption asking for a generous row gap, and when stacked on mobile a
28px gap against a 12px margin would repeat the inversion this entry fixes.

**Reopen if:** a grid's captions get longer or gain a second line of meta
(check the homepage 4-up row first), or a `SystemCard` grid gains a caption below
its image (then restore a separate, larger row gap for it).
