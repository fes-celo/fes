// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
  // /styleguide/* is an internal reference surface (the live type scale), not
  // a public page — noindexed in its own <head> and kept out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/styleguide') })],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 3001
  },
  vite: {
    plugins: [tailwindcss()]
  }
});