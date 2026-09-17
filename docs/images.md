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

## Reference table

| Slot | Component | Rendered as | Aspect ratio | Recommended source | Notes |
|---|---|---|---|---|---|
| Client logos | [LogoMarquee.astro](../src/components/LogoMarquee.astro) | `object-contain` box, 40×130px mobile → 56×170px desktop | flexible (own ratio kept) | **SVG** preferred; else transparent PNG ≥340×112px | Crop tight to the mark, no baked-in padding — the box already adds breathing room. |
| Systems page hero background | e.g. [creative-projects-blueprint/index.astro](../src/pages/systems/creative-projects-blueprint/index.astro), digital-communication, influence-reputation | Full-bleed, `sizes="100vw"` | **16:9** | **2560×1440** JPEG | Same pattern across every Systems sub-page hero. `widths: [640, 960, 1280, 1920, 2560]`. |
| Careers hero team photo | [careers/index.astro](../src/pages/careers/index.astro) | Full-bleed with scroll parallax | **3200:2297** (≈1.39:1) | Match this ratio exactly | The section box is sized *off the photo's own ratio* — a mismatched crop reintroduces clipping. Image renders at 128% scale for parallax drift, so keep key subjects clear of the outer ~14% margin on every edge. |
| Homepage hero | [Hero.astro](../src/components/Hero.astro) | Full-bleed | — | *(not a manual upload)* | Shader texture baked at build time, not photography. |
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
| Favicon | [BaseLayout.astro](../src/layouts/BaseLayout.astro) | Browser tab icon | 1:1 | `favicon.ico` only, `sizes="any"` | No `apple-touch-icon` or `site.webmanifest` currently — flagging as a gap rather than documenting sizes that don't exist yet. Worth adding a 180×180 PNG apple-touch-icon and a manifest if home-screen install/PWA polish is ever prioritized. |

## Briefing photographers / clients

When asking a client or photographer for source material, request the
**largest resolution they have** in the right *orientation* per slot
(landscape for hero/card images, portrait for team photos, square crops
tolerated for logos) — cropping down from an oversized original is always
safe; upscaling a small one isn't. The ratios above are what to frame for;
the pixel numbers are the floor, not a hard cap, since Astro downsizes for
you at build time.
