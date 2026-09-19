# Next steps — revisão técnica e prompts de execução

Escrito a 2026-09-18 contra o commit `31d9d69`. Cada afirmação aqui foi
verificada no repo, não estimada.

Este ficheiro é operacional: a secção 1 diz **o que está mal**, a secção 2 dá
**um prompt por frente de trabalho**, ordenados por prioridade. Cada prompt é
autónomo — abre uma sessão nova, cola o bloco, trabalha até ao *Done when*.

Complementa (não substitui) [final-phase-prompt.md](final-phase-prompt.md),
que é o plano por gates. Aqui os gates estão partidos em sessões do tamanho
certo e cobrem três frentes que o final-phase não trata em detalhe: domínio/DNS,
SEO técnico e a decisão de CMS.

---

## 1. Revisão — o que está efectivamente partido

Por ordem de gravidade.

### 1.1 O site nunca foi deployed, e a config não deixa

Três defeitos concretos, todos em `wrangler.jsonc`:

| Linha | Está | Devia | Efeito hoje |
|---|---|---|---|
| `assets.directory` | `./dist` | `./dist/client` | `/` serve um índice de directórios; todas as rotas 404 |
| `main` | `@astrojs/cloudflare/entrypoints/server` | nada, ou um Worker real | `output: 'static'` ⇒ `dist/server/` compila vazio; o entrypoint não tem nada atrás |
| — | sem `deploy` script, sem CI, sem projecto Cloudflare ligado a `fes-celo/fes` | — | nenhum preview URL jamais existiu |

Consequência em cadeia: `_redirects`, `_headers` e o beacon de analytics
**nunca foram executados pela plataforma**. Tudo o que está em `public/_headers`
e em `dist/client/_redirects` é, neste momento, hipótese não testada.

### 1.2 O form de contacto é inerte — e não é só falta de endpoint

`src/pages/contact/index.astro:57` faz POST para `/api/contact`. Essa rota não
existe. Mas o problema é mais fundo do que "falta escrever o ficheiro":

**Com `output: 'static'` não há endpoints Astro em runtime.** Um
`src/pages/api/contact.ts` seria pré-renderizado no build e nunca correria. O
endpoint tem de ser uma Pages Function (`functions/api/contact.ts`) ou um
fetch handler de Worker — e isso **pré-decide a bifurcação Pages vs Workers**,
que `docs/handoff.md` §4 lista como decisão #5 ainda em aberto.
`docs/measurement.md` já assume "Pages Function" em dois sítios. Vale a pena
assumir isso explicitamente em vez de deixar a decisão pendurada.

Não existe `functions/`, não existe `.env`, não existe chave Resend em lado
nenhum. `PUBLIC_CF_BEACON_TOKEN` também não.

### 1.3 Cinco links mortos numa página que vai a público

`src/lib/projects.ts` liga seis case studies a partir de `/projects/`. Só
`/projects/we-want-you/` existe. Os outros cinco 404 — e 53 linhas do
redirect-map (9.894 impressões de GSC) estão à espera deles.

### 1.4 18% dos redirects estão vivos

```
[redirects] 34/185 rows  (32.789 impressões cobertas)
   skipped 125 — target não construído   (12.777 impressões)
   skipped  19 — por resolver no CSV      (3.829 impressões)
   skipped   1 — precisa de regra de zona (1.834 impressões)
```

As 125 resolvem-se sozinhas assim que as páginas existirem. As 19 precisam de
decisão humana. A 1 é a variante `http://www.` da homepage — `_redirects`
casa só no path, por isso essa vive no dashboard da Cloudflare.

### 1.5 SEO técnico: a base está boa, o tecto não existe

O que já está certo e não se mexe: canonical por página, sitemap com filtro de
`noindex` sincronizado à mão em `astro.config.mjs`, `robots.txt` a apontar para
`sitemap-index.xml`, OG + Twitter cards, JSON-LD `Organization`.

O que falta:

- **JSON-LD é só `Organization`.** Sem `ProfessionalService`/`LocalBusiness`
  (há morada no Porto e não está a ser usada para isso), sem `BreadcrumbList`,
  sem schema por case study.
- **Uma única imagem OG para o site inteiro** (`/og-default.jpg`). Nenhuma
  página passa `ogImage`.
- **Sem `apple-touch-icon`, sem web manifest** — já assinalado no fim de
  `docs/images.md`.
- **Sem Search Console.** Sem propriedade, sem sitemap submetido, sem baseline
  das 32.789 impressões que se está a tentar preservar.
- **EN-only sem `hreflang` nem decisão PT registada.** O selector de locale foi
  removido (§12) e o PT nunca foi decidido (Open Question #1 do roadmap).

### 1.6 Performance abaixo do piso em pelo menos uma página

`/agency/` mediana 89 mobile contra um piso de ≥90. As duas causas já estão
diagnosticadas em `parked-decisions.md` §13 (scripts de secções below-the-fold
carregados a module scope; três pesos Inter render-blocking em `global.css`
só como fallback do Aeonik). Homepage e `/careers/` — as duas páginas mais
pesadas, 722 e 810 linhas — **nunca foram auditadas**.

### 1.7 CMS: a decisão está a bloquear-se a si própria

Sanity é decisão #1 em aberto, mas depende da decisão #2 (Resources). Como está
em `handoff.md` §4: seis case studies e doze logos não justificam um CMS;
setenta e duas linhas de redirect com blog posts e playbooks justificam. A
ordem correcta é decidir Resources → e só então avaliar Sanity.

---

## 2. Prompts, por prioridade

Os prompts estão em inglês porque todo o repo e docs estão em inglês.

**Preâmbulo comum** — todos os prompts assumem estas regras da casa, já
documentadas em `AGENTS.md` e `docs/handoff.md`:

- Ler `docs/handoff.md` → `docs/status.md` → `docs/parked-decisions.md` antes
  do primeiro edit.
- Qualquer decisão fora do briefing entra em `docs/parked-decisions.md` como
  nova entrada numerada (*what · why · what would reopen it*) **antes** de
  seguir em frente.
- `npm run build` é o gate; a linha `[redirects]` é métrica real.
- Verificar em browser e mostrar prova. Nunca "should work".
- `astro dev --background`, porta 3001.

---

### P0 — Bloqueia tudo o resto

Nada abaixo de P0 pode ser testado sem P0. Os dois prompts podem correr na
mesma sessão, mas o 1 tem de acabar antes do 2.

#### P0.1 · Tornar o site deployable

```
You are taking over the FES Agency website (Astro 7, static output, Cloudflare).
Read docs/handoff.md, then docs/status.md § Deployment, then
docs/parked-decisions.md, before your first edit. Follow the house rules in
AGENTS.md: log every off-brief decision in docs/parked-decisions.md as a new
numbered entry, and treat `npm run build` as the gate.

GOAL: get this repo to a working Cloudflare deployment with per-branch preview
URLs. It has never been deployed once. Do not change any design or content.

DECIDED (do not re-litigate): **Cloudflare Workers Static Assets, not Pages.**
Two reasons, both already true of this repo before you start:
   - `wrangler.jsonc` as it stands (`main` pointing at a Worker entrypoint +
     an `assets` binding) is already Workers Static Assets syntax, not a Pages
     config — the previous developer had already leaned this way even though
     `docs/status.md` still frames it as an open fork.
   - Cloudflare's own current guidance for new projects is Workers with static
     assets: Pages remains supported but new platform features land on Workers
     only, and one Worker can serve the static site *and* the `/api/contact`
     handler (as a fetch handler, since `output: 'static'` means there is no
     runtime Astro endpoint — a `src/pages/api/contact.ts` would prerender at
     build time and never execute).
   - `_redirects` and `_headers` in `public/` are supported by Workers Static
     Assets the same way as by Pages — confirm this against current Cloudflare
     docs as you wire it up, but do not treat it as an open question.
   Record this as the parked-decisions entry (it was open in `handoff.md` §4
   as decision #5 — close it, don't reopen it).
1. FIX wrangler.jsonc. Today: `assets.directory` is "./dist" but the build
   writes ./dist/client, and `main` points at
   @astrojs/cloudflare/entrypoints/server while astro.config.mjs is
   output:'static', so dist/server/ builds empty. Make the config describe what
   is actually built as a Workers Static Assets project, and add the fetch
   handler for `/api/contact` (built out fully in P1.1 — here, just make sure
   the routing shape is in place).
2. ADD a `deploy` npm script and wire the fes-celo/fes GitHub remote to the
   Cloudflare project so every branch gets a preview URL. From this point
   stakeholders review a link, not localhost.
3. SET PUBLIC_CF_BEACON_TOKEN (Cloudflare Web Analytics) as a build-time env
   var in the Cloudflare project, not in the repo. BaseLayout.astro:70 already
   renders the beacon conditionally on it.
4. DOCUMENT the whole thing in a new docs/deployment.md: target, project name,
   env vars and where they live, build command, how to roll back a deploy.

DONE WHEN, with evidence pasted:
- A preview URL serves / correctly (screenshot), and /agency/ and
  /projects/we-want-you/ render with images.
- An old URL from docs/redirect-map.csv 301s to the right place ON THAT URL
  (paste the curl -I output).
- A /hero/ asset returns the Cache-Control from public/_headers (curl -I).
- You can point at a pageview you caused in Cloudflare Web Analytics.
```

#### P0.2 · Domínio, DNS e ambiente de staging

```
Context: the FES Agency site (this repo) is replacing a live WordPress site on
fesagency.pt. We control the domain and the current server. The new site now has
a Cloudflare deployment and preview URLs (see docs/deployment.md). Read
docs/handoff.md and docs/status.md first. This task is preparation only — DO NOT
cut traffic over to the new site; that is a separate, later task.

GOAL: get the domain and DNS into a state where the cutover is a low-risk,
reversible switch, and give stakeholders a stable URL to review.

NOTE on the existing server: it does NOT host the new site — the new site
deploys to Cloudflare Workers Static Assets (decided in P0.1). The existing
server's role from here on is the WordPress rollback fallback in step 2 below,
and possibly the mail server behind hello@fesagency.pt (separate concern,
confirm in step 6) — nothing else.

1. AUDIT the current DNS for fesagency.pt and write it down verbatim in
   docs/deployment.md before changing anything: registrar, nameservers, every
   A/AAAA/CNAME/MX/TXT record, current TTLs. MX and TXT (SPF/DKIM/DMARC) are the
   ones that break email if they get lost in a nameserver move — capture them
   exactly.
2. PLAN the rollback explicitly: the WordPress site must stay running and
   reachable on a non-public hostname (e.g. legacy.fesagency.pt or the host's own
   URL) for at least two weeks after cutover, per docs/roadmap.md Phase 6.
   Confirm it is reachable there and note the URL.
3. ATTACH a stable staging hostname to the Cloudflare project — a subdomain such
   as staging.fesagency.pt — and put it behind HTTP basic auth or Cloudflare
   Access, plus a `noindex` header for that hostname only. A staging site that
   gets indexed is a duplicate-content problem on the exact domain we are trying
   to protect.
4. WRITE the zone-level rules that `_redirects` cannot express, but DO NOT
   enable the ones that would affect production traffic yet — stage them and
   document them. At minimum: http://www.fesagency.pt/ → https://fesagency.pt/
   (this is the 1 skipped row in the `[redirects]` summary, worth 1,834
   impressions), plus www → apex for every path.
5. LOWER the TTL on the records that will change at cutover to 300s, at least
   48h before the planned switch, so a rollback propagates in minutes.
6. PRE-FLIGHT email: confirm that whatever inbox receives hello@fesagency.pt is
   unaffected by everything above, since the contact form will send to it.

DONE WHEN:
- docs/deployment.md contains the full before-state DNS table, the rollback
  hostname, and a step-by-step cutover runbook with its rollback steps.
- staging.fesagency.pt serves the new site, is password-protected, and returns
  a noindex header (paste curl -I).
- The legacy WordPress is confirmed reachable on its fallback hostname.
DO NOT point the apex record at Cloudflare yet.
```

---

### P1 — A razão de o site existir

#### P1.1 · Contact form, Resend e a cadeia de conversão

```
Read docs/measurement.md IN FULL first — the lead taxonomy is frozen and you are
implementing it, not designing it. Then docs/handoff.md §3 and
docs/status.md § Routes that do not exist. Follow AGENTS.md house rules.

CONTEXT that is easy to get wrong: astro.config.mjs sets output:'static', so an
Astro endpoint at src/pages/api/contact.ts would be prerendered at build time
and never execute. The POST handler is a **Worker fetch handler** (P0.1 decided
Workers Static Assets, not Pages — do not build a Pages Function).
src/pages/contact/index.astro:57 already posts to /api/contact with fields
name/email/message — that contract is fixed; build the backend to it.

DECIDED (do not re-litigate): send via **Resend**, not Cloudflare's native
`send_email` binding. Resend is mature, free to 3,000 emails/month (far above
this form's volume), and does not require fesagency.pt's DNS to be on
Cloudflare. Cloudflare Email Service is real but still in public beta as of
this writing — too risky as the only channel for leads. Revisit only if Resend
becomes a genuine cost or reliability problem in production.

GOAL: a visitor can submit the contact form and we receive the email, and the
lead is measurable.

1. BUILD the /api/contact handler: Turnstile verification → validate required
   fields → send via Resend to hello@fesagency.pt → write the minimal
   server-side record (timestamp, name, email, message) → 302 to
   /contact/thank-you. docs/measurement.md explains why the record exists
   independently of analytics; pick the storage (KV is the obvious fit on
   Cloudflare) and log the choice as a parked decision.
   - Set a reply-to of the submitter's address so replying from the inbox works.
   - RESEND_API_KEY and TURNSTILE_SECRET_KEY are secrets — Cloudflare project
     secrets, never in the repo, never in a PUBLIC_ var. Only the Turnstile
     SITE key is public.
   - Verify the sending domain in Resend (DKIM + SPF records on fesagency.pt)
     before claiming this works, or every email lands in spam. Coordinate this
     with whoever owns the mail server behind hello@fesagency.pt (see P0.2) —
     Resend only needs DNS records added for sending, it does not touch
     inbound mail or the existing inbox.
   - Handle failure honestly: if Resend errors, the visitor must see an error
     state, not a thank-you page. A 302 to /contact/thank-you on a failed send
     corrupts the lead metric, which is the whole point of that URL.
2. ADD the Turnstile widget to the contact form markup. Keep it accessible and
   keep the form working without JS where the platform allows it.
3. BUILD /contact/thank-you as a real page with warm copy and an onward pointer.
   This URL IS the form-conversion metric — treat it as product, not as a
   formality. It should be noindex (and therefore added to NOINDEX_PATHS in
   astro.config.mjs — see the trap in docs/handoff.md §3.4).
4. BUILD /go/booking as a 302 to the scheduling provider and re-point every
   booking CTA on the site at it. If the provider is still undecided (open
   question #4), build the route against a placeholder target, flag it loudly,
   and do not block the rest of this task.
5. RATE-LIMIT the endpoint and cap the message length. It is a public POST that
   sends email on our domain's reputation.

DONE WHEN:
- You have received a real test email in the hello@fesagency.pt inbox,
  triggered from the preview/staging URL, not from localhost. Paste a screenshot
  of the received email.
- A submission with a failed Turnstile does NOT reach /contact/thank-you.
- The stored record for that submission can be read back (paste it).
- /go/booking 302s (curl -I) and no booking CTA links to a provider URL
  directly (grep the source to prove it).
```

#### P1.2 · Links mortos, case studies e cobertura de redirects

```
Read docs/status.md § Routes that do not exist and § Redirects, then
docs/handoff.md §3.3 (the redirect script silently skips rows whose target is
not built — by design). Follow AGENTS.md house rules.

GOAL: no internal link 404s, and the `[redirects]` coverage moves materially
above the current 34/185.

1. BUILD the five missing case studies. src/lib/projects.ts links six from
   /projects/ and only /projects/we-want-you/ exists — five dead links on a page
   that is about to be public, plus 53 redirect rows (9,894 GSC impressions)
   waiting on them. caseStudies.ts is block-composed and PlaceholderBlock covers
   missing photography, so these can and should ship layout-complete before the
   images land. Mark any entry that is not client-approved `draft: true`, and
   remember that a draft renders noindex AND must be added to NOINDEX_PATHS in
   astro.config.mjs by hand — two halves of one decision, two files.
2. RESOLVE the Resources question (open decision #2 in docs/handoff.md §4).
   72 redirect rows and 2,883 impressions point at a section that was cut from
   the nav. The current state is the worst of the three options. Present the
   choice with the numbers — build it / re-map the rows to the nearest live
   page / let them 404 — recommend one, and get an explicit answer before
   building. Note that this same decision determines whether a CMS is worth it
   at all (see P2/CMS).
   Note: src/lib/nav.ts footerItems still links /resources/newsletter/, which is
   a dead link shipping in the footer of every page. That one is a defect
   regardless of how the section question is answered — fix it now.
3. RESOLVE the 19 unresolved rows in docs/redirect-map.csv (cells marked
   NEEDS MANUAL REVIEW / PENDING, 3,829 impressions). These need judgement, not
   code — go row by row, propose a target for each, and flag the ones that
   genuinely need Liliana.
4. RE-RUN the build and quote the new `[redirects]` line.
5. CRAWL the built output for internal 404s and fix every one. A link checker
   over dist/client, or a script that resolves every href in the build against
   the set of built routes — either is fine, but produce the list.

DONE WHEN:
- Zero internal links resolve to a route that was not built (paste the checker
  output showing zero).
- The `[redirects]` summary is quoted before and after.
- Every previously-unresolved CSV row either has a target or a named blocker.
```

---

### P2 — Descoberta e velocidade

Estes dois podem correr em paralelo, depois de P1.2 (não vale a pena optimizar
SEO de páginas que ainda não existem).

#### P2.1 · SEO técnico e Search Console

```
Read docs/status.md, docs/handoff.md §3.4 (the sitemap/noindex sync trap), and
src/components/SEO.astro before changing anything. The basics here are already
right — canonical per page, sitemap with a noindex filter, robots.txt pointing
at sitemap-index.xml, OG + Twitter cards, Organization JSON-LD. Do not rebuild
what works. Follow AGENTS.md house rules.

CONTEXT: this is a same-domain WordPress → Astro migration carrying ~32,789 GSC
impressions' worth of mapped URLs. Rankings are lost in migrations through
missing redirects and lost signals, not through bad markup — so weight this work
accordingly.

1. SET UP Google Search Console for fesagency.pt (domain property, not URL
   prefix) BEFORE cutover, and export the current baseline: queries, pages,
   impressions, clicks, average position, for the last 16 months. That export is
   the only way anyone will ever be able to say whether the migration worked.
   Save it into docs/ alongside redirect-map.csv. Also verify Bing Webmaster
   Tools while you are there — it is five minutes.
2. AUDIT title and meta description on all 21 built routes. Produce a table:
   route · title · length · description · length · verdict. Flag duplicates,
   anything over ~60 chars of title or ~155 of description, and anything that
   reads as a label rather than a search result. SEO.astro appends "· FES
   Agency" unless the title already contains it — account for that in the count.
3. EXTEND the structured data in SEO.astro:
   - Organization → also emit ProfessionalService (or LocalBusiness) with the
     Porto address, sameAs to the social profiles in src/lib/nav.ts, and contact
     details. The address is already in the file but only as PostalAddress
     inside Organization.
   - BreadcrumbList on the nested Systems pages and case studies.
   - A per-case-study schema on /projects/<slug>/.
   Validate every one against Google's Rich Results Test and paste the result.
4. GIVE the key pages their own OG image. Today every page shares
   /og-default.jpg and no page passes `ogImage`. At minimum: home, /agency/,
   /systems/ and its three children, /contact/, each case study. Read
   docs/images.md for the export rules — do not invent dimensions.
5. ADD the apple-touch-icon and web manifest flagged as missing at the bottom of
   docs/images.md.
6. DECIDE and record the language situation. The site is EN-only; the footer
   locale switcher was removed (parked-decisions §12); Open Question #1 in
   docs/roadmap.md ("does PT carry real search equity?") was never answered and
   the GSC baseline from step 1 answers it directly. If PT URLs carry equity,
   that changes the redirect map and the roadmap. Either way, log the decision
   and add hreflang only if PT is actually coming.
7. CHECK that the sitemap filter and the pages' own noindex still agree after
   P1.1 and P1.2 added routes (/contact/thank-you, any draft case study).

DONE WHEN:
- GSC property verified, baseline exported into the repo, sitemap submitted.
- The title/description table is in docs/ with every flag resolved.
- Rich Results Test passes on home, a Systems page, and a case study (paste).
- Every key page has its own OG image, verified in a real link preview
  (paste a screenshot from a messaging app or the Facebook debugger).
```

#### P2.2 · Performance, acessibilidade e code review

```
Read docs/parked-decisions.md §13 — it already names the two performance fixes,
so do not re-diagnose from scratch. Read docs/handoff.md §2 for the motion
architecture before touching any script loading. Follow AGENTS.md house rules.

GATE: every key page medians ≥90 mobile over THREE Lighthouse runs. Mobile
varies ±5 points; a single run proves nothing and claiming one is a violation
of the house rules.

1. FIX /agency/, currently at a median of 89 against the ≥90 floor. The two
   named causes:
   - Below-the-fold section scripts load at module scope on every page except
     SystemAddonsMarquee, which was moved behind an IntersectionObserver +
     dynamic import() and dropped initial JS from 190KB to 150KB. Apply the same
     treatment to the others. Read motion.ts's header first: hidden states are
     set from JS deliberately, so a script that never loads must not leave a
     section blank — the lazy path has to preserve that guarantee.
   - global.css imports three self-hosted Inter weights purely as an Aeonik
     fallback, render-blocking, on every page. Decide what the fallback is
     actually worth and act on it (subset, drop weights, or font-display).
2. AUDIT the homepage and /careers/ — 722 and 810 lines, the two heaviest pages
   in the project, never audited once. Lighthouse + axe, both.
3. RUN axe on every route and fix what it finds. Two known classes of past
   failure are recorded as parked-decisions §11 (SplitText stamping a prohibited
   aria-label on <p> — SplitText must run with aria:'none') and §12 (contrast).
   Watch for regressions of both.
4. CHECK the images against docs/images.md — that file is authoritative for
   dimensions and was derived from the actual widths/sizes props. Confirm no
   slot is being served an oversized source, and that LCP on the homepage is an
   image that is actually preloaded.
5. CLEAR the two `astro check` hints: the deprecated frameborder attributes on
   the Tech Refresh embeds, and the unused existsSync import in
   tools/build-redirects.mjs. Free wins.
6. RUN /code-review over the branch and act on the findings.

DONE WHEN:
- A table of route · three mobile Lighthouse scores · median, for home,
  /agency/, /careers/, /systems/, /systems/influence-reputation/, /projects/,
  a case study and /contact/ — every median ≥90.
- axe is clean on the homepage and /careers/ (paste the report).
- `npx astro check` is 0 errors, 0 warnings, 0 hints.
- Any perf trade-off you took is a new numbered entry in parked-decisions.md.
```

---

### P3 — CMS

Não começar antes de a decisão de Resources (P1.2 passo 2) estar tomada. É essa
que determina se um CMS se paga.

#### P3.1 · Decisão de CMS (memo antes de schema)

```
Read docs/handoff.md §4 "On Sanity specifically" IN FULL before writing a single
schema. It names three non-obvious costs, and the ordering constraint that
matters. Read src/lib/caseStudies.ts's opening comment — the content layer was
written to be replaced, and says so.

GOAL: a decision memo, not an implementation. Do not model anything yet.

Produce docs/cms-decision.md that answers, with the repo's own numbers:

1. WHAT actually needs editing without a developer, and how often. Today the
   content layer is four typed TS modules: caseStudies.ts (246 lines,
   block-composed), projects.ts, clients.ts, phases.ts. Six case studies and
   twelve logos do not justify a CMS. The 72 redirect rows' worth of blog posts
   and playbooks under /resources/ might. State which of those is actually
   happening, based on the Resources decision that has now been taken.
2. WHO edits. If the answer is "Marcelo, occasionally", a CMS may be pure cost —
   Astro Content Collections with Markdown gives non-developer-ish editing with
   zero infrastructure. Compare at least: stay on typed TS modules · Content
   Collections + Markdown in-repo · Sanity · a git-backed visual CMS. The
   roadmap's original direction was Content Collections; Sanity arrived after
   and contradicts it — say which wins and why.
3. THE THREE COSTS, quantified rather than restated:
   - Static output means publish → rebuild. A Sanity webhook hitting a
     Cloudflare deploy hook is the entire mechanism; there is no runtime fetch.
     That is a ~27s feedback loop for an editor. Confirm the current build time
     and say it out loud to whoever will be editing.
   - import.meta.glob on src/assets/ does not survive the move. Case study
     images resolve by basename from a local folder today, and PlaceholderBlock's
     "layout-complete before photography" behaviour depends on it. Sanity's asset
     pipeline replaces both. Scope that rewrite concretely — it is the real cost
     of the migration, not the schemas.
   - Cost and lock-in: seat pricing, what happens to the content if the
     subscription lapses, and who owns the dataset.
4. RECOMMEND one option in one sentence, with the condition that would flip it.

DONE WHEN: docs/cms-decision.md exists, every claim in it carries a number from
this repo, and it ends with a recommendation and a decision owner. Add the
decision to docs/parked-decisions.md once it is taken.
```

#### P3.2 · Implementação do CMS *(só depois de P3.1 aprovado)*

```
Only start this if docs/cms-decision.md has been approved and the answer was a
CMS. Read it, plus docs/handoff.md §4, before modelling.

SEQUENCE — it is not arbitrary:
1. Model /resources/ FIRST. It is where the value is and where the 72 redirect
   rows point. Case studies second. Do not start with case studies because they
   are the familiar shape.
2. Keep the shapes in src/lib/*.ts as the schema contract — they were written
   for this. A case study is a left rail of flat fields plus an ordered list of
   blocks (media | text), which maps onto Portable Text almost one to one. If
   your schema diverges from those types, say why.
3. REWRITE the image resolution. import.meta.glob by basename is going away;
   plan what replaces PlaceholderBlock's missing-image behaviour, because
   "layout-complete before the photography exists" is a working method here, not
   an accident.
4. WIRE publish → Cloudflare deploy hook, and put a visible "last published"
   signal somewhere the editor can see it. A 27s silent gap after clicking
   publish will be read as a broken button.
5. PRESERVE the redirect contract: every new /resources/ URL must match what
   docs/redirect-map.csv expects, or the 72 rows still do not emit. Check the
   `[redirects]` line before and after.

DONE WHEN: an editor who is not you publishes a change and sees it live,
unaided, while you watch. Plus the `[redirects]` line quoted before and after.
```

---

### P4 — Cutover

#### P4.1 · Passagem de tráfego para o site novo

```
Follow docs/roadmap.md Phase 6 — it is still correct — plus the runbook written
into docs/deployment.md during P0.2. Read both. Do not start unless P0, P1 and
P2 are all closed with their evidence.

PRE-FLIGHT (all on the staging hostname, before touching DNS):
- Every key page renders; zero internal 404s; `[redirects]` coverage quoted.
- A real contact-form submission lands in the inbox and the record is stored.
- Lighthouse medians ≥90 mobile on the key pages.
- Cloudflare Web Analytics is receiving pageviews.
- The legacy WordPress is reachable on its fallback hostname.

CUTOVER:
1. Switch DNS. TTLs are already at 300s from P0.2.
2. Enable the zone-level rules staged in P0.2 (http/www → https apex).
3. Remove the staging hostname's noindex and its password — or, better, keep
   staging protected and verify production separately. Do not ship a noindex
   header to production; check for it explicitly (curl -I on the apex).
4. Submit the sitemap in Search Console and request indexing on the key pages.
5. Spot-check 20 of the highest-impression rows in redirect-map.csv against the
   live domain with curl -I. Not the preview — the live domain.

THE WEEK AFTER — this is the part people skip:
- Watch Search Console daily for seven days. Every new 404 is a missing
  redirect row and gets fixed in hours, not at the next sprint.
- Watch /contact/thank-you and /go/booking pageviews daily against the stored
  records — that reconciliation is the whole reason both exist
  (docs/measurement.md).
- Keep WordPress running but unreachable for two weeks as the rollback.

DONE WHEN: seven consecutive days with no new 404s in GSC, and at least one
real lead through the chain. Then write the post-launch note into
docs/status.md and re-measure every number in it.
```

---

## 3. Ordem sugerida

```
P0.1 deploy  ──▶ P0.2 domínio ──┬──▶ P1.1 form/Resend ──┐
                                └──▶ P1.2 links/redirects ──┬──▶ P2.1 SEO ──┐
                                                            └──▶ P2.2 perf ─┴──▶ P4 cutover
                                     P1.2 passo 2 (Resources) ──▶ P3.1 memo CMS ──▶ P3.2
```

P3 é o único ramo que pode ficar para depois do launch sem custo — desde que a
decisão de Resources (P1.2) seja tomada antes, porque essa tem consequências
em 72 linhas de redirect que têm de estar resolvidas no cutover.
