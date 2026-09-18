# Case study images

One folder per case study, named after its slug — the same slug used in
`src/lib/caseStudies.ts` and in the URL (`/projects/<slug>/`).

```
src/assets/case-studies/
  we-want-you/
    01.webp
    02.webp
    ...
```

## Dropping pictures in

`src/pages/projects/[slug].astro` resolves images **by basename, ignoring the
extension**: a block that declares `file: '01'` picks up `01.webp`, `01.jpg`,
`01.png` or `01.avif` — whichever is in the folder. So you can drop the files
straight in without touching any code.

Until a file exists, that slot renders a labelled `PlaceholderBlock` naming
the exact path it wants, so the page stays layout-complete.

Two files with the same basename and different extensions (`01.jpg` **and**
`01.webp`) are a conflict — only one of them wins, arbitrarily. Keep one.

## Format and size

Astro optimises these at build time (`astro:assets`), so drop the largest
version you have rather than a pre-resized one — WebP or a high-quality JPEG
both work. SVG is passed through unoptimised; use it for logos only.

The aspect ratio of the well is set per-image in `caseStudies.ts` (`aspect`),
not by the file — the image is `object-cover`-cropped to it. Adjust the token
there if a picture needs a different crop.
