# Image specs — resolutions, ratios, formats

Reference sheet for every image slot on the site, pulled from the actual
component props (`widths`/`sizes` on each `<Image>`, and the CSS box each one
renders into) rather than guessed. Use it to brief photographers/clients on
what to shoot and deliver, and to know what to export when a new asset lands.

## How the pipeline works (read this first)

Astro's image pipeline (`astro:assets`, `imageService: 'compile'` in
[astro.config.mjs](../astro.config.mjs)) resizes everything **at build time**
from a single source file — it generates every size in a component's
`widths` array for you. That means:

- You only need **one** source file per image, at or above the largest number
  in that component's `widths` prop (see table below). Don't pre-export
  multiple sizes yourself.
- Don't upload arbitrarily huge "just in case" originals either — the largest
  `widths` value listed below *is* the real ceiling for that slot; anything
  bigger only adds build time and repo weight for zero visual gain.
- Where a slot has no `widths` array (fixed-size UI images, not full-bleed
  photography), the rule of thumb is **2× the largest CSS size it ever
  renders at**, for sharpness on high-DPI screens.

Source files for anything going through `<Image>` live in `src/assets/`,
organised by section (`src/assets/projects/`, `src/assets/logos/`,
`src/assets/people/`, `src/assets/systems/…`, etc.) — put new assets in the
matching folder rather than `public/`. `public/images/` is reserved for the
one runtime exception noted below (the careers cursor-trail tiles), which
bypass `astro:assets` on purpose.

**Formats:** JPEG for photography. PNG only when transparency is required
and the source isn't vector (e.g. a client logo with no SVG available). SVG
is preferred for every logo/icon — it's crisper, has no `widths` array to
worry about, and is what [LogoMarquee.astro](../src/components/LogoMarquee.astro)
is built around. WebP appears in exactly one place (below) because that path
is hand-optimized outside the normal pipeline.

## From Figma to `src/assets/`

Figma is fine as the cropping and review step; it just isn't a good place to
take the master *from* as-is. Its PNG export is lossless but 15–25MB for a
large photo (git keeps every version), and its JPG export has no quality
control. So:

1. Crop inside a frame with the slot's exact aspect ratio (table below).
2. Export **PNG** at the slot's width typed explicitly — e.g. `3840w` — never
   `1x`, which exports at the frame's on-canvas size. Check the dropped-in
   original is at least that big first: Figma upscales silently, and caps
   imports at 4096px on the long side.
3. Drop the PNGs into `images-inbox/` (git-ignored) and run
   `npm run images -- --slot <slot>` (`--list` shows the slots). It converts
   each one to a JPEG q92 master in sRGB, warns if it's under the slot's
   width or off its ratio, shrinks anything larger to that width, and keeps
   files with transparency as PNG. `--out <folder>` overrides the
   destination; with no `--slot` it converts without checking.

The slot table in [tools/ingest-images.mjs](../tools/ingest-images.mjs)
mirrors the "Recommended source" column below — change both together.

## Reference table

| Slot | Component | Rendered as | Aspect ratio | Recommended source | Notes |
|---|---|---|---|---|---|
| Client logos | [LogoMarquee.astro](../src/components/LogoMarquee.astro) | `object-contain` box, 40×130px mobile → 56×170px desktop | flexible (own ratio kept) | **SVG** preferred; else transparent PNG ≥340×112px | Crop tight to the mark, no baked-in padding — the box already adds breathing room. |
| Systems page hero background | e.g. [creative-projects-blueprint/index.astro](../src/pages/systems/creative-projects-blueprint/index.astro), digital-communication, influence-reputation | Full-bleed, `sizes="100vw"` | **16:9** | **2560×1440** JPEG | Same pattern across every Systems sub-page hero. `widths: [640, 960, 1280, 1920, 2560]`. |
| Careers team photo | [careers/index.astro](../src/pages/careers/index.astro) | Full-bleed (100vw) in a 7:5 section, scroll parallax | **1:1, mandatory** | **3840×3840** JPEG q90+ / PNG / TIFF master, *not* pre-compressed | The image box is square (140% of a 7:5 section's height = its width), so a non-square source gets cropped by `object-cover`. `widths: [640, 1024, 1600, 2048, 2560, 3200, 3840]`, `sizes: 100vw` — 3840 covers a 1920 screen at DPR 2; Astro caps the set at the source width, so a smaller master silently ships smaller. Encoded as WebP at `quality={90}` (Astro's default is 80 — parked-decisions §67); measured in `dist/` off the current 3840 master (2026-10-01): 47KB (640), 103KB (1024), 230KB (1600), 357KB (2048), 532KB (2560), 740KB (3200), 972KB (3840). A master that is already lossy WebP/JPEG gets compressed twice — hand over the least-compressed file there is. The section shows a sliding 71% of the image's height; only the band from ~24% to ~76% is on screen for the whole scroll, so keep faces inside it. Full width is always visible. |
| Homepage hero | [Hero.astro](../src/components/Hero.astro) | Full-bleed | **1:1, mandatory** | **1000×1000** lossless WebP or PNG, luminance only | Not photography. The authored source is `src/assets/hero/hero-heatmap-shape.webp`; replacing it means re-running [bake-hero-assets.html](../tools/bake-hero-assets.html) and moving all three outputs into `public/hero/`. 1:1 is not a preference — the fragment shader un-pads by a fixed 1000/1750 on both axes, and a non-square source brings back a band of bare padding. 1000×1000 is a real ceiling, not a floor: `toProcessedHeatmap` draws the source into a hardcoded 1000px box, so anything larger is discarded. Colour is discarded too (converted to luminance); white is background, dark is the shape. |
| Dual CTA card ("Get in touch" / "Our work") | [DualCta.astro](../src/components/DualCta.astro) | Full-bleed card, min-height 360–480px | **2000:1618** (≈1.24:1) | **2000×1618** JPEG | `widths: [640, 1000, 2000]`, `sizes: 50vw/100vw`. Has a hover zoom, so keep subject away from the extreme edges. |
| System cards (Systems index, 3-col grid) | [SystemCard.astro](../src/components/SystemCard.astro) | Grid card, `sizes: 33vw/100vw` | **1200:882** (≈4:3) | **1200×882** JPEG | Optional overlay graphic (icon/badge) at 640×360, PNG with transparency. |
| Problem cards | [SystemProblemCards.astro](../src/components/SystemProblemCards.astro) | Pinned card media | **860:916** (portrait, ≈0.94:1) | **860×916** JPEG | `widths: [430, 860]`. |
| Addon cards (carousel/marquee) | [SystemAddonsCarousel.astro](../src/components/SystemAddonsCarousel.astro), [SystemAddonsMarquee.astro](../src/components/SystemAddonsMarquee.astro) | Card, up to 22.5rem (360px) CSS wide | **3:4** portrait | ≥720×960 JPEG | Fixed `aspect-ratio: 3/4` in CSS, not an `<Image>` `widths` array — size for 2× the 360px box. |
| Project cards (grid, slider, home) | [ProjectCard.astro](../src/components/ProjectCard.astro), [ProjectCardSlider.astro](../src/components/ProjectCardSlider.astro), [ProjectsGrid.astro](../src/components/ProjectsGrid.astro) | Card cover | **886:580** default (≈1.53:1); `ProjectsGrid`/related cards use **429:280**, same ratio scaled down | **1800×1180** JPEG | Widths are computed as `[0.5, 1, 1.5, 2]×` the rendered width, so a single source at this size covers every usage. |
| Project detail — cover / embedded video | [projects/[slug].astro](../src/pages/projects/[slug].astro) | Hero media | **16:9** | ≥1920×1080 JPEG | Same box is reused for the video embed placeholder. |
| Project detail — gallery images | [projects/[slug].astro](../src/pages/projects/[slug].astro) | Gallery grid | **4:3** | ≥1600×1200 JPEG | |
| Team portraits (Agency page carousel) | [agency/index.astro](../src/pages/agency/index.astro) | Card, 220–400px CSS wide | **400:524** (≈3:4 portrait) | **800×1048** JPEG | Confirmed 2× pairing already in use in the codebase. |
| Small inline portrait (e.g. founder headshot) | [index.astro](../src/pages/index.astro) | ≤220px CSS wide, capped by wrapper | **3:4** | ≥440px wide JPEG | Same 3:4/2× pattern as above, smaller box. |
| Careers cursor-trail tiles | [careers/index.astro](../src/pages/careers/index.astro) | Square tile, 220px CSS, `pointer: fine` only (no phones) | **1:1** | **440×440 WebP, quality 80** | Deliberately outside `astro:assets` — pre-resized copies live in `public/images/careers-trail/`; keep untouched originals in `src/assets/careers-trail-originals/`. Regenerate with `sharp`, short-side 440, if the set changes. |
| Podcast/video-series thumbnails | [podcast-video-series/index.astro](../src/pages/systems/creative-projects-blueprint/podcast-video-series/index.astro) | YouTube facade poster | **430:294** (≈1.46:1) | ≥860×588 JPEG | Static poster shown before the real embed loads. |
| Open Graph / social share | [SEO.astro](../src/components/SEO.astro) | `og:image` / `twitter:image` | **1200:630** (1.91:1, standard OG ratio) | **1200×630** JPEG | Default lives at `public/og-default.jpg`. Override per page via the `ogImage` prop where a page wants its own. |
| Favicon / PWA icons | [BaseLayout.astro](../src/layouts/BaseLayout.astro) | Browser tab, home-screen, manifest icons | 1:1 | `favicon.svg` (any size), `favicon.ico` (legacy), `favicon-32x32.png` / `favicon-16x16.png` (PNG fallback), `apple-touch-icon.png` **180×180**, `icon-192.png` / `icon-512.png` (the 512 doubling as the manifest's maskable icon), `safari-pinned-tab.svg` (monochrome silhouette, no background — Safari uses only its alpha channel as a mask) | See [parked-decisions §63](parked-decisions.md). |

## Briefing photographers / clients

When asking a client or photographer for source material, request the
**largest resolution they have** in the right *orientation* per slot
(landscape for hero/card images, portrait for team photos, square crops
tolerated for logos) — cropping down from an oversized original is always
safe; upscaling a small one isn't. The ratios above are what to frame for;
the pixel numbers are the floor, not a hard cap, since Astro downsizes for
you at build time.
