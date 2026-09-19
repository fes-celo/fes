# Final phase — the working prompt

Paste this whole file as your opening message when you pick this project up,
or invoke it as a skill. It is written to be read once and then worked
through in order.

---

You are taking over the FES Agency website rebuild in its final phase. The
build is substantially complete and has never been deployed. Your job is to
get it live, working, and measurable — not to redesign it.

**Before your first edit, read in this order:** `docs/handoff.md` (context and
traps), `docs/status.md` (measured current state), `docs/parked-decisions.md`
(fourteen decisions that look like bugs and are not). Then skim
`docs/roadmap.md` for the original plan and its four known divergences. Do not
start by reading source files — the docs will tell you which ones matter.

## How to work on this codebase

1. **Assume every odd-looking choice is load-bearing until you have read the
   comment above it.** This repo documents decisions at the moment they are
   taken. A float where you expected a grid, a JS-set hidden state where you
   expected CSS, a script where you expected a checked-in file — each has a
   recorded reason.
2. **Write down every decision you take that was not in the brief**, as a new
   numbered entry in `docs/parked-decisions.md`, in the existing format: what
   was decided · why · what would reopen it. Do this as you go, not at the end.
3. **Verify in a real browser and show the proof.** Never hand back "should
   work". Screenshot it, or paste the network/console evidence.
4. **`npm run build` is the gate**, and the `[redirects]` summary it prints is
   a real metric — quote it when it changes.
5. **Ask before assuming on the six open decisions** listed in
   `docs/handoff.md` §4. Three of them block launch. Guessing on any of them
   produces work that gets thrown away.
6. Dev server: `astro dev --background` on port 3001. Mobile Lighthouse varies
   ±5 points; take a median of three runs before claiming a number.

## Gate 0 — Make it deployable *(blocks everything else)*

Nothing downstream can be tested until this passes. `_redirects`, `_headers`,
the analytics beacon and the contact form have all never been executed by the
platform.

- Decide **Cloudflare Pages vs Workers Static Assets** and say why in
  `parked-decisions.md`. This determines whether `_redirects` and Pages
  Functions are even the right mechanisms.
- Fix `wrangler.jsonc`: `assets.directory` points at `./dist`, the build
  writes `./dist/client`. Also resolve `main` pointing at a Worker entrypoint
  while `astro.config.mjs` is `output: 'static'` and `dist/server/` builds
  empty.
- Connect the `fes-celo/fes` remote so **every branch gets a preview URL**.
  That was the roadmap's staging plan and it was never switched on. From this
  point, stakeholders review a link, not your laptop.
- Set `PUBLIC_CF_BEACON_TOKEN` and confirm a pageview actually lands in
  Cloudflare Web Analytics.

**Done when:** a preview URL serves the homepage correctly, an old URL from
`redirect-map.csv` 301s to the right place *on that URL*, and you can point at
a pageview you caused.

## Gate 1 — The conversion chain *(this is the point of the site)*

`docs/measurement.md` froze this design in Phase 0A and nothing was built. The
contact form currently posts to a 404.

- Build `/api/contact`: Turnstile → validate → send via Resend to
  hello@fesagency.pt → write the minimal server-side record (timestamp, name,
  email, message) → 302 to `/contact/thank-you`.
- Build `/contact/thank-you` as a real page with warm copy and an onward
  pointer. **This URL is the form-conversion metric** — it is not a
  formality.
- Build `/go/booking` as a 302 to the scheduling provider, and re-point every
  booking CTA on the site at it. *(Needs the provider decision — open question
  #4. If it is still unanswered, build the route against a placeholder target
  and flag it; do not block the rest of the gate.)*
- Read `docs/measurement.md` in full first. The design is decided; you are
  implementing it, not choosing it.

**Done when:** you have received a real test email, triggered from the preview
URL, on your phone. Not "the code looks right" — the email, in the inbox.

## Gate 2 — Close the content holes

Two of these are shipping defects, not backlog.

- **Five of six case studies 404.** `/projects/` links six; only
  `/projects/we-want-you/` exists. Five dead links on a live page, and 53
  redirect rows (9,894 impressions) waiting on them. `caseStudies.ts` is
  block-composed and `PlaceholderBlock` covers missing photography, so these
  can ship layout-complete before the images land.
- **Decide Resources** (open question #2). 72 redirect rows and 2,883
  impressions point at a section that was cut from the nav. Either build it or
  re-map those rows — the current state is the worst of both. This is also the
  decision that determines whether a CMS is worth it at all.
- Resolve the **19 unresolved rows** in `redirect-map.csv` (`NEEDS MANUAL
  REVIEW` / `PENDING`). These need judgement, not code.
- Get the **Influence & Reputation copy reviewed**. ~15 blocks of unreviewed
  machine translation are live on a page built to be sent to prospects
  (parked-decisions §6), plus an invented step-04 description (§7).
- Sweep `TODO(marcelo)` and the remaining `PlaceholderBlock` usages.

**Done when:** no internal link 404s, and the `[redirects]` line covers
materially more than the current 34/185.

## Gate 3 — Sanity *(only after an explicit decision)*

Do not start modelling until Gate 2's Resources decision has landed — it is
the thing that determines whether a CMS earns its place. Read
`docs/handoff.md` §4 "On Sanity specifically" before proposing a schema; it
names the three non-obvious costs, the important one being that
`import.meta.glob`-by-basename image resolution does not survive the move.

Sequence, if it goes ahead: model `/resources/` first (it is where the value
is), case studies second, and wire publish → Cloudflare deploy hook. Keep
`src/lib/*.ts`'s shapes as the schema contract — they were written for this.

## Gate 4 — Performance, accessibility, code review

- `/agency/` is at **89 mobile** against a ≥90 floor. `parked-decisions.md`
  §13 already names the two fixes: apply the `IntersectionObserver` +
  dynamic-`import()` treatment used in `SystemAddonsMarquee` to the other
  below-the-fold section scripts, and deal with the three render-blocking
  Inter weights imported in `global.css` purely as an Aeonik fallback.
- **Audit the homepage and `/careers/`** — 722 and 810 lines, the two heaviest
  pages, never audited.
- Run `/code-review` over the branch. The two `astro check` hints
  (`frameborder` on the Tech Refresh embeds, the unused `existsSync` import)
  are free wins.
- Add the `apple-touch-icon` and manifest flagged as missing at the bottom of
  `docs/images.md`.

**Done when:** every key page medians ≥90 mobile over three runs, and axe is
clean on the homepage and `/careers/`.

## Gate 5 — Cutover

Follow `docs/roadmap.md` Phase 6 as written; it is still correct. The parts
that matter: pre-flight the whole thing on the final preview, keep WordPress
running but unreachable for two weeks as the rollback, submit the sitemap and
request indexing immediately, then **watch Search Console daily for a week**.
Every new 404 is a missing redirect row and gets fixed in hours.

**Done when:** seven consecutive days with no new 404s in GSC, and at least
one real lead through the chain.

---

## Do not

- Do not redesign. The visual work is signed off; the remaining work is
  plumbing, content and correctness.
- Do not reopen the `astro:page-load` / `astro:before-swap` lifecycle pattern,
  or the "hidden state comes from JS" rule. Both are marked validated in
  `docs/conventions.md` and `src/lib/motion.ts` for reasons recorded there.
- Do not add a UI framework. There is not one React/Vue/Svelte island in the
  codebase and adding one needs an argument, not a preference.
- Do not re-anchor a type token to fix one element. Move the element to a
  different step — `docs/typography.md` explains why.
- Do not emit a redirect whose target does not exist. The build script refuses
  to for a reason: a 301 to a dead page is a soft 404, and Google treats it as
  deliberate.
- Do not mark anything done without the evidence named in that gate's **Done
  when**.
