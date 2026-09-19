# FES Website Migration — Implementation Roadmap · v4

> **Provenance note (added at handoff, 2026-09-18).** This document was written
> before Phase 0A and is the source every other doc in `docs/` cites when it
> says "Phase 3" or "Phase 6" — but it was never committed. It lived at
> `~/Downloads/fes-website-migration-plan-v4.md` and was recovered from an old
> session transcript. It is restored here **verbatim**, so the phase numbers
> scattered through `conventions.md`, `measurement.md` and `redirect-map.csv`
> finally resolve to something.
>
> **Read it as history, not as instructions.** Four things in it have since
> been overtaken by decisions taken during the build — see
> ["Where this roadmap is now wrong"](#where-this-roadmap-is-now-wrong) at the
> bottom, which is the only part of this file not from the original. For what
> is actually true today, read [status.md](status.md); for what to do next,
> read [final-phase-prompt.md](final-phase-prompt.md).

---


> **What changed from v3:** corrected the Agency/Services build-order line to match the confirmed IA (separate pages, Systems as lead-gen hub, six-item nav); replaced the broken analytics assumption (Cloudflare Web Analytics has no custom events) with a thank-you-page + server-side lead-counting model; added the missing form delivery chain (Resend + Turnstile); surfaced the EN/PT scoping decision; added a launch/cutover phase and per-phase "definition of done" checkpoints. Restructured as a mentor-style execution roadmap: each phase has Context, Action Plan, and Why.

---

## How to use this document

This is the source of truth for Phase 1. When it conflicts with older plans (v2/v3) or older conversation threads, **this document wins**. Each phase ends with a checkpoint — do not start the next phase until the checkpoint passes. That discipline is the difference between a two-week build and a six-week one.

Since this is your first build: the phases are ordered so that every phase produces something *visible and testable*. You will never be more than a few days from seeing progress in a browser.

---

## Corrections carried into this version (read once, then trust the phases)

1. **IA correction.** Agency and Systems are **separate pages**. The old "merge Services into Agency" idea is dead. Nav: Agency · Systems · Projects · Resources · Tech Refresh · Contact. Systems is the lead-gen hub with Growth Communication System and Influence & Reputation System as flagship pages, and Signature Projects as a hub with three sub-pages. URL pattern: `/systems/…`.
2. **Analytics correction.** Cloudflare Web Analytics is pageview-only — it cannot track CTA clicks or form submits as events. Lead measurement therefore works like this:
   - Form submit → Pages Function → **redirect to `/contact/thank-you`**. That page is a trackable pageview and an unambiguous conversion URL.
   - Booking-link click → routed through `/go/booking` (a tracked redirect) instead of linking out directly.
   - The Pages Function **also counts every submission server-side** (and emails it to you), so lead data exists even if analytics fails.
3. **Form delivery correction.** A Pages Function receiving a form is not a working form. The chain is: Turnstile (spam) → validation → Resend (email to hello@fesagency.pt) → redirect to thank-you. All free-tier.
4. **Scope addition.** EN/PT bilingual status must be decided in Phase 0 (see Open Questions). Everything downstream — URLs, redirects, content volume — depends on it.

---

## Phase 0A — Decisions & Inputs (no code; ~2 days)

**Context.** Every expensive mistake in a migration happens here, not in the code. The two classic first-project failure modes are (a) building on an unconfirmed decision that later reverses, and (b) discovering scope mid-build. This phase closes both. Nothing in it requires Opus — it's you, a spreadsheet, and two conversations.

**Action plan.**
1. **Pull the live-URL inventory.** Export indexed pages from Google Search Console (Pages report) and crawl the site with Screaming Frog free tier. Merge into one list.
2. **Build the redirect map** as a simple two-column file (`old URL → new URL`) in the repo: `docs/redirect-map.csv`. Rules: every ranked URL keeps its URL if the page survives; pages being removed redirect to the closest surviving equivalent (e.g., old Services URL → `/systems/` hub); never redirect everything to the homepage.
3. **Get Liliana's sign-off on the Events nav demotion** — before the nav is built, not after. One message, one decision. If she says no, the nav is still six items and nothing else changes; if yes, Events moves under Systems/Projects and the redirect map gets one more row.
4. **Decide EN/PT scope** (see Open Questions). Recommended for a two-week Phase 1: launch EN-only, preserve PT URLs with redirects to EN equivalents, add PT in Phase 2 via Astro's built-in i18n routing. If PT pages carry real ranking equity in GSC, this recommendation flips — check the data first.
5. **Freeze the lead-event taxonomy** in `docs/measurement.md`: what counts as a lead (form submit, booking click), the exact URLs that represent them (`/contact/thank-you`, `/go/booking`), and where the server-side counts live.
6. **Confirm Phase-1 copy ownership.** The system pages have placeholder copy by design — fine. But the Homepage and Agency copy refinements (kill the generic "success/partner" language, one-sentence hero positioning, de-duplicate the service block that currently repeats across three pages) are Phase 1 scope. Decide now: who writes it, by when. If it's you + Claude, block the time.

**Why this way.** The redirect map is the highest-leverage hour of the whole project — same-domain migrations lose rankings through missing 301s, not through bad code. The Liliana sign-off is sequenced here because nav is built once in the base layout in Phase 0B; changing it later touches every page. The copy decision is here because "structure done, copy pending" is how two-week projects become two-month projects.

**Checkpoint.** `redirect-map.csv` exists and covers every GSC-indexed URL · Events decision recorded · EN/PT decision recorded · measurement doc written · copy owner + deadline named.

---

## Phase 0B — Repo Scaffold & Foundations (~2–3 days)

**Context.** This is the only phase where everything depends on everything. Done properly, every later phase is "build a page." Done sloppily, every later phase re-litigates tokens, fonts, and layout. It's also the phase with the single expensive Figma pull — one full sync, per the established workflow.

**Action plan.**
1. **Scaffold Astro** with the locked stack: Tailwind v4 via `@tailwindcss/vite`, TypeScript on shared components and Content Collection schemas, plain Astro elsewhere.
2. **One-time Figma sync** from the FES-Brand file: all semantic tokens → the global `@theme` block; the six existing components (Button, Tag, Filter Tab, Stat Block, Testimonial Card, Project Card) → Astro components. House rule everywhere: `var(--color-brand)` inside component `<style>` blocks, never `@apply` against `@theme` tokens.
3. **Aeonik loading**: self-hosted `@font-face`, `font-display: swap`, preload the one or two critical weights, subset the files if the license allows (WOFF2, Latin subset — typically cuts weight by more than half).
4. **Base layout**: six-item nav, footer, `<ClientRouter />` enabled site-wide from day one (retrofitting view transitions after scripts exist is miserable — the `astro:page-load` / `astro:before-swap` lifecycle pattern from §4 of v3 stands unchanged).
5. **SEO baseline as a single `<SEO>` component**: title/meta/canonical, OG image defaults, `schema.org` Organization markup, sitemap integration, `robots.txt`, and a designed 404 page (the 404 will actually be seen during a migration — treat it as a real page with a CTA back to Systems).
6. **Ship the redirect file**: translate `redirect-map.csv` into Cloudflare's `_redirects` format now, even though nothing is live — it deploys with the site and gets tested on previews.
7. **Wire Cloudflare**: create the Pages project, connect the repo, confirm preview deployments work. **Use branch previews as your staging** — free, shareable URLs. This replaces "local-only, no staging": Liliana reviews a preview link, not your laptop.
8. **Analytics**: Cloudflare Web Analytics snippet in the base layout. That's all it does — pageviews. Lead measurement is the thank-you-page pattern, built in Phase 3.
9. **Animation-ready markup conventions** documented in `docs/conventions.md`: `data-anim` attributes, wrapper elements for reveals, clean text nodes for SplitText. Authored into every page from Phase 1 onward; shipped motionless.

**Why this way.** One Figma pull instead of many is the token-efficiency pattern that already works for this project. Previews-as-staging costs nothing and removes the biggest first-project risk: shipping something a stakeholder sees for the first time in production. The `<SEO>` component exists so that per-page SEO in Phases 1–5 is a five-line frontmatter block, not a per-page research task. `ClientRouter` goes in now because the GSAP lifecycle architecture assumes it — that decision is already validated, don't reopen it.

**Checkpoint.** A preview URL renders a styled placeholder homepage with correct nav, Aeonik loading, 404 working, `_redirects` deploying, and Lighthouse ≥ 95 on the empty shell. If the empty shell doesn't score well, nothing built on it will.

---

## Phase 1 — Homepage (~3 days)

**Context.** Flagship page, primary lead-gen surface, and — as your first real page — where you establish the rhythm: Figma frame → one extraction pass → build → preview → adjust via plain-text instructions. Every subsequent page reuses this rhythm and gets faster.

**Action plan.**
1. Build against the Figma frame, one full extraction pass, then iterate by text instruction only.
2. Apply the confirmed copy direction: single positioning sentence in the hero (the problem FES solves for tech companies, not "your partner in success"); "What is FES Agency" block does **not** appear here — it lives on Agency only; compact solutions presentation that points to Systems rather than duplicating service lists.
3. Featured work: 6 projects — client name, one-line description **always visible**, service/area tag. Testimonials with work context added ("what FES actually did for them").
4. Stats block, client logos, and a single repeated CTA pattern pointing at Contact (the modular CTA block built properly in Phase 3 — use a placeholder link until then).
5. Author animation-ready markup per the conventions doc; ship motionless.
6. Images through `astro:assets` exclusively — responsive, AVIF/WebP, lazy below the fold.

**Why this way.** The homepage is deliberately built *before* Contact so that when the CTA block is finalized in Phase 3, you retrofit it into one existing page and learn what "modular" needs to mean — cheaper than guessing the abstraction upfront. Killing the duplicated service block here (it currently repeats near-verbatim on three pages) is the visible proof that the rebuild has an editorial point of view, not just a new stack.

**Checkpoint.** Preview link of the full homepage, real copy, mobile-checked, Lighthouse ≥ 90, shared with Liliana.

---

## Phase 2 — Agency (~2 days)

**Context.** Separate page, per the corrected IA. This is where the 10-years story, culture, and "What is FES Agency" live — the page that answers "who are these people," while Systems answers "what will they do for me."

**Action plan.**
1. "What is FES Agency" moves here exclusively. Connect the 10 years of experience to the "helping startups and tech businesses grow" narrative in one continuous story rather than stacked disconnected sections.
2. Add the differentiation content flagged in the audit: remote culture, geographic diversity framed as a client advantage, vision and values. "Filling Empty Spaces" and "frisky, focused and funky" rank **high** in the hierarchy — they're the most ownable assets on the site and currently buried.
3. Service imagery shows *results*, not process (per the audit: outcomes, coverage, launched work — not people at desks).
4. Team photo strip: build desktop per Figma; mobile behavior is a parked decision — implement a plain non-interactive stack as the temporary mobile state and log it in `docs/parked-decisions.md`.

**Why this way.** Agency is second because it's the page most entangled with the copy de-duplication work — doing it immediately after the Homepage means the "what goes where" editorial decisions happen while they're fresh, in one sitting, instead of leaking into every later page. Parking the responsive decision with a safe default keeps the phase on schedule without pretending the decision was made.

**Checkpoint.** Preview link · no sentence appears on both Homepage and Agency · parked-decisions log started.

---

## Phase 3 — Contact & the Conversion Chain (~2 days)

**Context.** The page every CTA on the site points at, and the machinery that makes the whole rebuild measurable. Smallest page, highest stakes — if this phase is wrong, the site can look perfect and you'll still be unable to answer "did it work?"

**Action plan.**
1. **Contact page** with both paths, visually equal: the form and the booking link.
2. **Form chain**: Turnstile widget → Pages Function validates → sends via Resend to hello@fesagency.pt → stores a minimal record (timestamp, name, email, message) → 302 to `/contact/thank-you`.
3. **Thank-you page**: real page, warm copy, a "while you wait" pointer to Resources or a flagship System page. This URL *is* your form-conversion metric.
4. **Booking link** routed through `/go/booking` → 302 to the scheduling provider. That pageview *is* your booking-click metric. Swapping providers later = editing one redirect.
5. Retrofit the finished CTA block into Homepage and Agency; it becomes the standard block for every remaining page.
6. **Test the chain end-to-end from the preview URL**: submit → email arrives → thank-you renders → pageview appears in analytics. Do it on your phone too.

**Why this way.** The thank-you-page pattern is decades old because it works with *any* pageview analytics — no custom-event dependency, no vendor lock-in, and the server-side record means the lead count survives even an analytics outage. Turnstile over other options because it's native to the platform already chosen and invisible to most humans. Resend because Cloudflare cannot send email natively and Resend's free tier covers an agency contact form hundreds of times over.

**Checkpoint.** You have received a real test email from the live preview form. Not "the code looks right" — the email, in your inbox.

---

## Phase 4 — Systems Hub & Page Template (~2–3 days)

**Context.** The actual point of the rebuild. Copy is still being written by the team, which is precisely why this phase builds the *structure* now: when copy arrives, publishing a system page is a content swap, not a development task. These pages are also designed to be sent directly to prospects — they must stand alone.

**Action plan.**
1. **`/systems/` hub page**: positions the three offerings — Growth Communication System and Influence & Reputation System as recurring flagships, Creative Projects Blueprint as the project-based offer with its three sub-offerings.
2. **One system-page template** in Content Collections, schema authored Supabase-shaped (per v3 §1): hero/problem statement, what's included, how it works, proof, FAQ, CTA. The proof section must support **two modes** — metric-led (Growth, Influence) and visual before/after (Branding & Design) — because proof structure must match service type.
3. Instantiate the template with structured placeholder copy for all pages; publish behind no nav link or `noindex` until real copy lands.
4. Mint the new URLs under `/systems/` (final slugs pending the naming decision — the pattern is fixed, the words aren't).
5. Every system page ends in the Phase-3 CTA block — these are the pages where measurement matters most.

**Why this way.** Template-before-copy is the single biggest protection against the schedule risk you don't control (other people's writing). Supabase-shaped schemas now mean the Phase-2 content-layer move is a data migration, not a rebuild — a decision already validated, kept as-is. The dual proof modes go into the schema *now* because retrofitting a structural variant into a template that pages already use is exactly the kind of rework this plan exists to prevent.

**Checkpoint.** One placeholder system page fully rendered from a Content Collection entry, and a dry-run: swap in a paragraph of real-ish copy and confirm the page updates with zero component edits.

---

## Phase 5 — Remaining Pages (~3 days)

**Context.** Projects, Events, Resources, Careers, Tech Refresh. Content is largely stable and structural risk is low — this phase is about throughput, applying the established rhythm.

**Action plan.**
1. **Projects**: industry tabs as the single functional filter (Fintech, Scaleup, Crypto & Web3, HRtech, Cybersecurity, Public & Ecosystem); client-type pills on cards as non-interactive labels; descriptions always visible, never hover-only. Employer Branding removed from every filter and tag. Mobile behavior of Filter Tabs: parked — safe default is horizontal scroll with edge-fade; log it.
2. **Events**: homogenized spacing/weights, corrected scale copy (conferences up to 1,000 people; hackathons up to 250; smaller events of 75) and corrected currency range (€1,000 to $1M — pick one currency or format both deliberately). Nav placement per Liliana's Phase-0A decision. 4-column grid mobile behavior: parked, defaults to 2×2 → 1-col.
3. **Resources**: one-sentence introduction framing it as a library of playbooks and client studies for tech companies.
4. **Careers, Tech Refresh**: near-direct migrations. Tech Refresh keeps its current framing; the naming collision with the Blueprint's video/podcast sub-offering is a Phase-2 naming decision, not a Phase-1 build problem — just don't cross-link them as if they're the same thing.
5. Confirm every page's URL against the redirect map as it's built — this is where redirect rows get validated one by one.

**Why this way.** Batching the low-risk pages after the high-risk ones means mistakes in the rhythm were already caught where iteration was expected. The parked responsive decisions ship with safe defaults because a launch blocked on three component-level decisions is a bad trade — the log ensures they're revisited deliberately rather than forgotten.

**Checkpoint.** Every nav destination renders on the preview · redirect map validated row-by-row against real pages · parked-decisions log complete.

---

## Phase 6 — Launch & Cutover (~1 day + 1 week of watching)

**Context.** Same domain, DNS-level swap. Migrations don't fail at launch; they fail in the silent week after, when nobody is watching Search Console.

**Action plan.**
1. **Pre-flight on the final preview**: click every nav path, submit the form for real, hit `/go/booking`, spot-check 15–20 redirect rows by pasting old URLs against the preview, run Lighthouse on Homepage/Systems/Contact, check the four most important pages on a real phone.
2. **Cut over**: point the domain at Cloudflare Pages (single CNAME swap). Keep WordPress running but unreachable for two weeks — it's your rollback and your content reference.
3. **Immediately after**: submit the new sitemap in Search Console, request indexing on Homepage and the Systems hub.
4. **The watching week**: GSC Coverage report daily for 404 spikes (each one is a missing redirect row — fix within hours, not weeks); confirm analytics pageviews look sane; confirm a real form submission arrived post-launch.
5. Only after the watching week is clean: decommission WordPress.

**Why this way.** The rollback path (WordPress still running) turns launch from a high-stakes event into a reversible one — appropriate for a first project. The 404-watching routine is the operational half of the redirect work: the map you built in Phase 0A gets truth-tested by real traffic, and same-domain migrations that skip this step are how rankings quietly evaporate.

**Checkpoint.** Seven consecutive days with no new 404s in GSC and at least one real lead through the chain.

---

## Phase 1.5 — Motion (after launch; ~3–4 days)

**Context.** Unchanged in substance from v3 — GSAP architecture, lifecycle pattern, reduced-motion via `gsap.matchMedia()`, font-load coupling with `ScrollTrigger.refresh()`, per-island loading. What's clarified: motion ships **after** launch, not before. The site converts on copy, structure, and proof; motion is polish, and polish must never delay the lead-gen clock.

**Action plan.**
1. Run `improve-animations` (Emil Kowalski skill) across the codebase → self-contained execution plans in `plans/`, run by a cheaper model per the established token-efficiency workflow.
2. Implement per the v3 §4 lifecycle pattern exactly: `gsap.context` inside `astro:page-load`, full revert + `ScrollTrigger` kill on `astro:before-swap`, `matchMedia` for reduced motion.
3. GSAP core + ScrollTrigger loaded only on animating pages, deferred — never in the base layout.
4. Gate every batch with `review-animations` before merge; deploy in small batches, watching Lighthouse between batches.

**Why this way.** The animation-ready markup authored since Phase 1 makes this phase almost mechanical — the taste decisions were front-loaded into conventions, the correctness decisions into the validated lifecycle pattern. Shipping in batches post-launch means a motion regression is a small rollback, not a launch blocker.

**Checkpoint.** Motion live on Homepage + Systems pages, reduced-motion verified in OS settings, Lighthouse unchanged within ±3 points.

---

## Phase 2 (unchanged, for the record)

Supabase content layer · EN/PT if deferred · shader/liquid-glass visual refresh · Figma Code Connect · Tech Refresh naming resolution · Systems/Blueprint web-design overlap resolution (pending Liliana's service classification).

---

## Open Questions (answer during Phase 0A — none block starting the scaffold)

1. **EN/PT**: does the PT version carry real search equity (check GSC by page)? If yes, bilingual launch enters Phase 1 scope and adds ~30–40% to the timeline; if no, EN-only launch with PT redirects, PT returns in Phase 2 via Astro i18n.
2. **Events nav**: Liliana's sign-off — yes/no, one message.
3. **Careers page**: kept as-is in the nav footer only (current state) or promoted? Currently unaddressed in every plan version.
4. **Booking provider**: which tool (affects nothing structurally — `/go/booking` absorbs any answer — but needed before Phase 3 testing).
5. **Homepage/Agency copy**: who writes the refinements, and is the deadline before Phase 1 build starts (ideal) or during (workable)?

---

## Next step

Answer the Phase 0A questions, pull the GSC export, and say the word — the scaffold (Phase 0B) can start the same day.

---

## Where this roadmap is now wrong

*Added at handoff. Everything above this line is the original v4 document.*

1. **Nav is four items, not six.** `src/lib/nav.ts` ships Agency · Systems ·
   Projects · Contact. Resources and Tech Refresh were demoted to the footer
   and Events never got a nav decision at all (Open Question #2 was never
   answered). The consequence is quantified in [status.md](status.md): 72
   redirect rows still point at a `/resources/` section that does not exist.

2. **Content is TypeScript modules, not Content Collections.** Phase 4 called
   for a Content Collection with a Supabase-shaped schema. What was built is
   `src/lib/caseStudies.ts`, `projects.ts`, `clients.ts` and `phases.ts` —
   plain typed arrays, deliberately shaped so the migration is a
   schema-for-schema swap. The target is now **Sanity**, not Supabase, which
   is a decision taken after this document and is not analysed anywhere in it.

3. **Motion shipped before launch, not after.** Phase 1.5 says motion lands
   post-launch. In practice GSAP, Lenis, ScrollTrigger pins, split-text and
   the baked shader hero all shipped during the page builds. The lifecycle
   pattern this document specifies was followed; the sequencing was not. The
   cost is recorded in `parked-decisions.md` §13 — mobile Lighthouse is the
   site's tightest number, and it is tight because of motion.

4. **The Phase 0B checkpoint never passed.** Step 7 — "wire Cloudflare,
   confirm preview deployments work, use branch previews as your staging" —
   was not completed, and every phase after it was built and reviewed
   locally. See [status.md](status.md) § Deployment. This is the single
   largest gap between this plan and the repo.
