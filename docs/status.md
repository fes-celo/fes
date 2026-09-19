# Status — what is actually built, as of 2026-09-18

Every number here was measured against this repo at commit `31d9d69`, not
estimated. Re-measure rather than trust this file once it is a few weeks old;
the commands that produced each number are given so you can.

- **Type check:** `npx astro check` → 67 files, **0 errors, 0 warnings**, 3 hints
  (two deprecated `frameborder` attributes on the Tech Refresh embeds, one
  unused import in `tools/build-redirects.mjs`).
- **Build:** `npm run build` → **21 pages in ~27s**, clean.
- **Never deployed.** See [Deployment](#deployment) — this is the headline.

---

## Routes that exist

```
/                                                    /careers/
/agency/                                             /contact/
/systems/                                            /tech-refresh/
/systems/digital-communication/                      /privacy-policy/
/systems/influence-reputation/                       /cookies-policy/
/systems/creative-projects-blueprint/                /404
/systems/creative-projects-blueprint/branding/       /styleguide/type      (noindex)
/systems/creative-projects-blueprint/events-activations/
/systems/creative-projects-blueprint/podcast-video-series/
  └── + a /dark/ variant of each of the three sub-pages (noindex, design review only)
/projects/
/projects/we-want-you/                               ← the ONLY case study built
```

Regenerate this list with:

```bash
find dist/client -name index.html | sed 's|dist/client||;s|/index.html|/|' | sort
```

## Routes that do not exist but are linked or redirected to

| Missing | Who points at it | Cost |
|---|---|---|
| `/projects/<slug>/` × 5 | `src/lib/projects.ts` links six case studies from `/projects/`; five 404 | **5 dead links on a shipping page.** 53 redirect rows, 9,894 GSC impressions |
| `/resources/…` | 72 rows in `redirect-map.csv`; `footerItems` links `/resources/newsletter/` | 2,883 impressions land nowhere. The whole section was cut from the nav without being replaced |
| `/events/` | 1 redirect row, held `PENDING` on a nav decision never taken | Open Question #2 in [roadmap.md](roadmap.md), still open |
| `/api/contact` | `src/pages/contact/index.astro:57` posts to it | **The contact form is inert.** Submitting it 404s |
| `/contact/thank-you` | [measurement.md](measurement.md) defines it as *the* form-conversion metric | No lead measurement exists |
| `/go/booking` | [measurement.md](measurement.md) defines it as *the* booking metric; no CTA links to it yet | No lead measurement exists |

## Redirects

`npm run build` runs `tools/build-redirects.mjs`, which emits only rows whose
target was actually built — a row pointing at a missing page would turn a 404
into a soft 404, which is worse. Current output:

```
[redirects] 34/185 rows -> dist/client/_redirects  (32,789 impressions covered)
[redirects]   skipped 125 — target not built yet          (12,777 impressions)
[redirects]   skipped  19 — unresolved in the CSV          (3,829 impressions)
[redirects]   skipped   1 — needs Cloudflare zone config   (1,834 impressions)
[redirects]   skipped   2 — already correct, no redirect    (1,093 impressions)
```

**18% of the map is live.** The skipped list is the launch checklist: build
`/resources/` and the five case studies and 125 rows start emitting with no
edit to the script. The 19 unresolved rows are `NEEDS MANUAL REVIEW` /
`PENDING` cells in the CSV and need a human decision, not code. The 1 zone-config
row is the `http://www.` homepage variant — `_redirects` matches on path only,
so it belongs in Cloudflare's dashboard.

## Deployment

**The site has never been deployed.** Everything above was built and reviewed
on `localhost:3001`. Three concrete symptoms, all in `wrangler.jsonc`:

1. `assets.directory` is `./dist`, but the static output is `./dist/client`.
   A deploy today would serve the site one directory too high — `/` would be a
   listing containing `client/`, and every route would 404.
2. `main` points at `@astrojs/cloudflare/entrypoints/server`, but
   `astro.config.mjs` sets `output: 'static'`, so **`dist/server/` builds
   empty**. The Worker entrypoint has nothing behind it.
3. There is no CI, no `deploy` script, and no Cloudflare project linked to the
   `git@github.com:fes-celo/fes.git` remote.

Consequences worth stating plainly: `_redirects` and `_headers` have **never
been executed by the platform**, no stakeholder has ever seen a preview URL
(the roadmap's "previews as staging" plan was never activated), and the
analytics beacon in `BaseLayout.astro:70` has never fired — it also needs
`PUBLIC_CF_BEACON_TOKEN`, which is not set anywhere in the repo.

Resolving whether the target is **Cloudflare Pages** or **Workers Static
Assets** is the first fork: `_redirects`/`_headers` and Pages Functions are
Pages conventions, while `wrangler.jsonc` as written describes a Worker. Pick
one deliberately — the contact form's server-side half depends on the answer.

## Performance and accessibility

Measured on a production build, throttled 4G + slow CPU, recorded in
[parked-decisions.md](parked-decisions.md) §13. Mobile runs vary ±5 points, so
take a median of three — a single run is not a gate.

| Page | Mobile perf |
|---|---|
| `/systems/` | 99 |
| `/systems/influence-reputation/` | 92 (median of 90 / 95 / 92) |
| `/agency/` | **89** — below the project's ≥90 floor |

Accessibility is 100 on desktop for the pages audited, after two fixes logged
as §11 (a prohibited `aria-label` that SplitText stamped onto every `<p>`) and
§12 (the footer locale switcher failing contrast at 2.37:1). Neither the
homepage nor `/careers/` — the two heaviest pages, at 722 and 810 lines — has
been audited at all.

Known, unfixed, and already diagnosed in §13:

- Below-the-fold section scripts load at module scope on every page except
  `SystemAddonsMarquee`, which was moved behind an `IntersectionObserver` and
  dropped initial JS from 190KB to 150KB. The same treatment has not been
  applied anywhere else.
- `global.css` imports three self-hosted Inter weights purely as an Aeonik
  fallback, render-blocking, on every page.

## Content

Content lives in typed TypeScript modules, not a CMS and not Content
Collections: `caseStudies.ts` (246 lines, block-composed), `projects.ts`,
`clients.ts`, `phases.ts`. Each was written to be swapped for a real schema.

Known content debt, all of it deliberate and logged:

- **`/systems/influence-reputation/` copy is unreviewed machine translation.**
  ~15 blocks of client marketing copy were translated from the Portuguese
  Figma frame and have never been read by the client (parked-decisions §6).
- Approach **step 04's description is invented** — the Figma repeats step 03
  verbatim (§7, marked `TODO(marcelo)` in the page).
- `/systems/` accordion copy is placeholder written to demo the interaction.
- Testimonial `tag` is wired through `TestimonialCard` but **no testimonial
  carries one** (§14).
- Two selected projects (Anchorage Digital, Bridge In) have no thumbnail,
  category or route anywhere (§8).
- `PlaceholderBlock.astro` still stands in for real photography in several
  places — grep `TODO(marcelo)` for the list.
- The site is **EN only**. The footer locale switcher was removed rather than
  recoloured (§12); restoring it is the PT trigger.
