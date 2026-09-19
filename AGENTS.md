# FES Agency website

Astro 7 · static output · Tailwind v4 · Cloudflare · GSAP + Lenis. No UI
framework islands. See [README.md](README.md) for what this project is.

## Start here

This repo documents its decisions as it takes them, so the docs are the fast
path — read them before source files.

| If you are… | Read |
|---|---|
| New to this codebase | [docs/handoff.md](docs/handoff.md) — context, architecture, and the traps that cost a day |
| Asking "what is actually built?" | [docs/status.md](docs/status.md) — measured, with the commands that measured it |
| Picking up the remaining work | [docs/final-phase-prompt.md](docs/final-phase-prompt.md) — the gated plan to launch |
| Wondering why something odd was done | [docs/parked-decisions.md](docs/parked-decisions.md) — 14 numbered decisions in *what · why · what would reopen it* form |
| Changing text size | [docs/typography.md](docs/typography.md) — twelve named steps, a live inspector (`Shift+T`), and `/styleguide/type` |
| Adding or exporting an image | [docs/images.md](docs/images.md) — every slot's real ratio and ceiling, derived from the components |
| Animating anything | [docs/conventions.md](docs/conventions.md) — `data-anim`, clean text nodes, the `onPageLoad` lifecycle |
| Touching the contact form or a CTA | [docs/measurement.md](docs/measurement.md) — the lead taxonomy is already frozen |
| Looking for the original plan | [docs/roadmap.md](docs/roadmap.md) — plus the four ways it is now out of date |

**House rule:** any decision you take that was not in the brief gets a new
numbered entry in `docs/parked-decisions.md` before you move on.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and
`astro dev logs`. It runs on port 3001.

`npm run build` is the gate: it builds the site, prunes unreferenced originals
from `dist/_astro` (`tools/prune-unreferenced-assets.mjs`), and regenerates
`dist/_redirects` from `docs/redirect-map.csv`, printing a `[redirects]`
coverage summary. Rows whose target was not built are skipped on purpose —
read that summary, it moves on its own as pages are added.

## Documentation

Full Astro documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
