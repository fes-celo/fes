// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Surfaces that render `noindex` in their own <head>, and therefore must not
// appear in the sitemap either: submitting a URL you've asked not to be
// indexed is a contradiction Search Console reports as an error, and it
// spends crawl budget on pages that can never rank. Keep this list and the
// pages' own noindex in sync — they are two halves of one decision.
//
//   /styleguide          internal reference surface (the live type scale)
//   /dark/               dark-mode variants of the Creative Projects
//                        Blueprint sub-pages, kept for design review
//
// Case studies carry the same decision per entry, via `draft: true` in
// src/lib/caseStudies.ts — an entry marked draft renders `noindex` and must
// be added here as `/projects/<slug>` by hand. None are drafts today.
const NOINDEX_PATHS = ['/styleguide', '/dark/']

// https://astro.build/config
export default defineConfig({
  site: 'https://fesagency.pt',
  output: 'static',
  adapter: cloudflare({
    // Static output has no deployed Worker to serve the on-demand `/_image`
    // endpoint, so the Cloudflare Images binding (the adapter's default
    // whenever wrangler.jsonc declares an `images` binding) 404s in
    // production. 'compile' resolves every astro:assets Image at build time
    // into a real static file instead.
    imageService: 'compile',
  }),
  integrations: [sitemap({ filter: (page) => !NOINDEX_PATHS.some((path) => page.includes(path)) })],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 3001
  },
  vite: {
    plugins: [tailwindcss()]
  }
});