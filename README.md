# FES Agency website

The rebuild of [fesagency.pt](https://fesagency.pt) — a same-domain migration
off WordPress onto Astro, deployed to Cloudflare. The site's job is lead
generation: the Systems pages are built to be sent directly to prospects, and
every CTA resolves to a measurable URL.

**Stack:** Astro 7 (static output) · Tailwind v4 via `@tailwindcss/vite` ·
self-hosted Aeonik · GSAP + ScrollTrigger + SplitText · Lenis · Cloudflare
adapter. No React/Vue/Svelte islands.

## Commands

| Command | Action |
|---|---|
| `npm install` | Install dependencies (Node ≥ 22.12) |
| `astro dev --background` | Start the dev server on port 3001 (`astro dev status` / `logs` / `stop`) |
| `npm run build` | Build to `dist/client`, then regenerate `_redirects` from `docs/redirect-map.csv` |
| `npm run preview` | Preview the production build |
| `npx astro check` | Type-check `.astro` and `.ts` |

## Layout

```
src/
  pages/        routes (Systems pages are the deepest tree)
  components/   ~28 Astro components, no framework islands
  layouts/      BaseLayout — nav, footer, SEO, analytics
  lib/          the content layer (typed arrays) + the motion libs
  styles/       global.css — the design system lives in its @theme block
  assets/       everything that goes through astro:assets
public/         fonts, icons, _headers — served as authored
tools/          build-redirects.mjs, the hero-asset baker, pattern lab
docs/           see below
```

## Documentation

Start with **[docs/handoff.md](docs/handoff.md)** for context and
**[docs/status.md](docs/status.md)** for what is actually built. The full index
is in [AGENTS.md](AGENTS.md).
