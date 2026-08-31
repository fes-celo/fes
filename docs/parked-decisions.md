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

### 12. OPEN — footer locale switcher fails colour contrast

`BaseLayout.astro`'s footer renders the inactive locale as
`<span class="opacity-40">/</span><span class="opacity-40">pt</span>`, which
measures **2.37:1** against white — below the 4.5:1 required for 16px text.
Axe flags it on every page. Not fixed here: it affects all nine pages and the
40% opacity is a deliberate "inactive locale" design signal, so the fix is a
design call (darker base colour, or a real disabled treatment) rather than a
mechanical one.

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
