// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Surfaces that render `noindex` in their own <head>, and therefore must not
// appear in the sitemap either: submitting a URL you've asked not to be
// indexed is a contradiction Search Console reports as an error, and it
// spends crawl budget on pages that can never rank. Keep this list and the
// pages' own noindex in sync — they are two halves of one decision.
//
//   /styleguide          internal reference surface (the live type scale)
//   /contact/thank-you   only ever reached after a real form submission; it
//                        is the form-conversion metric (docs/measurement.md),
//                        and a crawler landing on it would count as a lead
//
// Case studies carry the same decision per entry, via `draft: true` in
// src/lib/caseStudies.ts — an entry marked draft renders `noindex` and must
// be added here as `/projects/<slug>` by hand. None are drafts today.
const NOINDEX_PATHS = ['/styleguide', '/contact/thank-you', '/projects/blip-activation']

// https://astro.build/config
export default defineConfig({
  site: 'https://fesagency.pt',
  // Fully static. No adapter: the site has no server-rendered route, and the
  // Cloudflare adapter was only ever here to force `imageService: 'compile'`
  // — which is what Astro's default sharp service already does for a static
  // build. Without it the output is a flat `dist/` that any static host
  // serves as-is; on Cloudflare Pages the `_redirects` and `_headers` files
  // in that folder are picked up directly, and the contact form's server
  // half is a Pages Function under `functions/`.
  output: 'static',
  integrations: [sitemap({ filter: (page) => !NOINDEX_PATHS.some((path) => page.includes(path)) })],
  // Next page ready before the click. `prefetchAll` puts every same-origin
  // link on the hover strategy (a fetch into the HTTP cache ~80ms before the
  // click lands); `clientPrerender` upgrades that to a Speculation Rules
  // prerender where the browser supports it (Chromium), so the destination
  // is fully rendered off-screen and the navigation is instant. Pages are
  // static and side-effect free, so prerendering one is safe — motion.ts
  // already waits for the document to become visible before animating.
  // See docs/parked-decisions.md §28.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  experimental: {
    clientPrerender: true,
  },
  build: {
    // Every stylesheet inlined into its page. The site's CSS is one ~50KB
    // Tailwind bundle plus a ~8KB per-page chunk on the Systems pages; as
    // separate files each is a render-blocking request that has to complete
    // before the first paint, and on a throttled mobile connection those
    // two requests measured 175–325ms of blocking on their own. Inlined, the
    // HTML carries everything first paint needs (the fonts are preloaded),
    // at the cost of ~10KB brotli per page that a shared CSS file would have
    // cached across navigations — a trade that favours a fifteen-page
    // marketing site where most visits are one or two pages long.
    inlineStylesheets: 'always',
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 3001
  },
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle the lazily `import()`ed GSAP plugins up front. Vite only
    // discovers a dynamic import the first time a page hits it, then
    // re-optimises mid-session and 504s ('Outdated Optimize Dep') every
    // module the open page already holds — which is how the drag carousels
    // silently stopped attaching in dev. Listing them here means the dep
    // graph is complete on the first start.
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'gsap/Draggable', 'gsap/InertiaPlugin', 'lenis', '@paper-design/shaders'],
    },
  }
});
