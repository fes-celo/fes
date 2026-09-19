# Handoff — what you need to know before you change anything

Written by the outgoing developer, 2026-09-18, for whoever takes this on next.
It is the stuff that is not visible from the code and not recoverable from git.

Read in this order: this file → [status.md](status.md) →
[final-phase-prompt.md](final-phase-prompt.md). The rest of `docs/` is
reference you pull when the task touches it.

---

## 1. The one thing to understand about this repo

**Every non-obvious decision in here was written down at the moment it was
taken, next to the code it affects.** That is not decoration — it is the
working method, and it is why a 30-commit repo carries this much comment.
`parked-decisions.md` has fourteen numbered entries, each in the same shape:
what was decided · why · what would reopen it. Component files carry the same
reasoning inline (`SectionIntro.astro` explains why it is a float and not a
grid; `motion.ts` explains why hidden states come from JS and not CSS;
`build-redirects.mjs` explains why it is a script and not a checked-in file).

So: **when something looks wrong, assume it is load-bearing until you have
read the comment above it.** Several of the things that look like mistakes are
documented trade-offs — the float instead of grid, the `data-anim` attributes
instead of classes, the resting-CSS-is-the-fallback rule, the `latin-400.css`
imports instead of the fontsource entry point. Each of those was arrived at
after the obvious version failed for a reason recorded on the spot.

And the corollary, which matters more: **if you take a decision that is not in
the brief, add it to `parked-decisions.md` as §15, §16, … before you move on.**
The next person's ability to work fast depends entirely on that habit holding.

## 2. Architecture in one screen

Astro 7, static output, Tailwind v4, Cloudflare adapter, GSAP + Lenis for
motion. No UI framework — there is not a single React/Vue/Svelte island, and
adding one should need a reason.

- **`src/styles/global.css`** (655 lines) is the design system. Twelve named
  type steps and every spacing/colour token live in its `@theme` block. House
  rule, stated at the top of the file: components consume tokens via
  `var(--color-*)` or the `text-*` utilities, and **never `@apply` against a
  `@theme` token inside a component `<style>` block**.
- **Typography has a workflow, not just tokens** — read
  [typography.md](typography.md). There is a live inspector (`Shift+T` in dev,
  hover any text to get `file:line — step — px`) and a `/styleguide/type` page
  that scans source for usage. When the client says "make this bigger", the
  answer is a step name, and changing a step changes it everywhere. That is the
  point; move the one wrong element to a different step rather than re-anchoring
  the token.
- **`src/lib/*.ts` is the content layer.** Typed arrays, not a CMS.
  `caseStudies.ts` is the interesting one: a case study is a left rail of flat
  fields plus an ordered list of `blocks` (`media` | `text`), so it is composed,
  not slotted into fixed sections. Images are referenced by **basename only**
  and resolved from `src/assets/case-studies/<slug>/` via `import.meta.glob`, so
  a page is layout-complete before the photography exists — a missing file
  renders `PlaceholderBlock` naming the path it wants.
- **Motion** is `src/lib/motion.ts` plus per-section libs. Two rules that are
  not negotiable and are explained in the file header: hidden states are set
  from JS so a script failure cannot blank the page, and **nothing animates a
  `<section>` box itself** (the homepage stacks a sticky hero, a scroll-driven
  light/dark invert zone and a footer reveal that measures `<main>`'s bottom
  edge — transforming a section fights all three).
- **Lifecycle:** every animation initialises through `onPageLoad` and tears
  down through `onPageUnload` from `src/lib/lifecycle.ts` (the ClientRouter
  is gone — parked-decisions §15). See
  [conventions.md](conventions.md), which ends with "this pattern is already
  validated for this project — don't reopen it". It means it.
- **Reduced motion is a real fallback, not an off switch** (parked-decisions
  §2). A user who only ever sees step 01 of four has lost information. Pinned
  choreography is also gated to `min-width: 1024px` — same branch, one fallback,
  not two (§1).

## 3. Traps — things that will cost you a day if nobody tells you

1. **`wrangler.jsonc` does not match the build output.** `assets.directory` is
   `./dist`; the build writes `./dist/client`. Nobody caught it because nothing
   has ever been deployed. Details in [status.md](status.md) § Deployment.
2. **The contact form posts to an endpoint that does not exist.** The page
   header says so; it is Phase 3 work that never happened. Do not treat the
   form as working because it renders.
3. **`tools/build-redirects.mjs` silently skips rows whose target is not
   built** — by design, so you never ship a 301-to-404. This means adding pages
   *changes your redirect coverage with no edit to the script*, and it means
   the coverage number in [status.md](status.md) moves on its own. Read the
   build log's `[redirects]` lines after every build.
4. **The sitemap's noindex list is maintained by hand** in `astro.config.mjs`
   (`NOINDEX_PATHS`) and must stay in sync with the pages' own `noindex`. A
   case study marked `draft: true` in `caseStudies.ts` renders noindex and has
   to be added to that array by hand. Two halves of one decision, in two files.
5. **`data-anim="split-text"` elements must contain a single clean text node.**
   No inline `<em>`, no `{variable}` interpolation. Nested markup breaks
   word/char boundaries unpredictably. And SplitText must run with
   `aria: 'none'` — the default stamps a prohibited `aria-label` on `<p>` and
   cost this project a WCAG violation on five pages (parked-decisions §11).
6. **`astro:assets` 400s when optimising SVGs**, which is why `LogoMarquee`
   has a `TODO` and handles them specially.
7. **`images.md` is authoritative for asset dimensions** and was derived from
   the actual `widths`/`sizes` props, not guessed. Do not export "just in case"
   originals — the largest `widths` value *is* the ceiling.

## 4. Open decisions you are inheriting

These are unresolved, and at least three of them block launch. Do not start
building around them without a decision.

| # | Decision | Why it is stuck |
|---|---|---|
| 1 | **Sanity or not** | New scope, arrived after the roadmap, and it contradicts the roadmap's Content Collections/Supabase direction. Nothing about it is analysed anywhere. See below. |
| 2 | **Resources section** | Cut from the nav; 72 redirect rows still point at it. Either build it or re-map those rows — the current state is neither. |
| 3 | **Events nav placement** | Open Question #2 in [roadmap.md](roadmap.md), awaiting Liliana since Phase 0A. One redirect row is parked `PENDING` on it. |
| 4 | **Booking provider** | Open Question #4. `/go/booking` absorbs any answer, but Phase 3 cannot be tested without one. |
| 5 | **Pages vs Workers** | Determines whether `_redirects` and a Pages Function are the right mechanisms at all. |
| 6 | **Influence & Reputation copy** | ~15 blocks of unreviewed machine translation are live on a page designed to be sent to prospects. |

### On Sanity specifically

The content layer was built to be replaced — `caseStudies.ts` says so in its
first paragraph, and the block array maps onto Portable Text almost one to one.
So the migration is genuinely a schema-for-schema swap, as intended. But three
things are not obvious and should be decided before any modelling starts:

- **Static output means publish → rebuild.** A Sanity webhook hitting a
  Cloudflare deploy hook is the whole mechanism; there is no runtime fetch.
  That is correct for this site, and it is also a ~27s feedback loop for an
  editor. Say that out loud to whoever will be editing.
- **`import.meta.glob` on `src/assets/` does not survive the move.** Case study
  images currently resolve by basename from a local folder. Sanity's asset
  pipeline replaces that, which means `[slug].astro`'s image resolution and
  `PlaceholderBlock`'s "layout-complete before photography" behaviour both get
  rewritten. That is the real cost of the migration, not the schemas.
- **The value is in `/resources/`, not in the case studies.** Six case studies
  and twelve logos do not need a CMS. Seventy-two redirect rows' worth of blog
  posts and playbooks do. If Sanity is being adopted to unblock Resources, the
  modelling should start there and reach the case studies second.

## 5. How to work here

- **`astro dev --background`**, then `astro dev status` / `logs` / `stop`.
  Port 3001.
- **`npm run build` before you claim anything works.** It runs `astro check`'s
  sibling concerns and the redirect generator; the `[redirects]` summary at the
  end is a real signal.
- **Verify in a browser, don't ask the client to.** Take the screenshot.
- **Mobile Lighthouse varies ±5 points — take a median of three.** `/agency/`
  is at 89 against a ≥90 floor, so a single good run proves nothing.
- **Commit messages here are one imperative line describing the change's
  effect**, not its mechanism. `git log --oneline` reads as a changelog; keep
  it that way.
- The client-facing contacts are **Liliana** (decisions, sign-off) and
  **Marcelo** (everything marked `TODO(marcelo)` in source).
