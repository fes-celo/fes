/**
 * Turns Figma exports into source masters for src/assets/.
 *
 *   npm run images -- --slot team-photo               (everything in images-inbox/)
 *   npm run images -- --slot project-card a.png b.png --out src/assets/projects
 *   npm run images -- photo.png --out src/assets/careers   (no slot: convert only)
 *   npm run images -- --list                          (the slots and their sizes)
 *
 * WHY. Figma's PNG export is lossless but runs 15-25MB for a 3840px photo,
 * which git keeps forever; its JPG export has no quality control. Neither
 * is a good master. This converts once to JPEG q92 — visually lossless, a
 * few MB — and Astro does the real compression for the site at build time
 * (see docs/images.md, "How the pipeline works").
 *
 * WHAT, per file:
 * - Checks it against the slot's ratio and width (SLOTS below, mirrored from
 *   the docs/images.md reference table — keep the two in sync). Too small is
 *   a warning, not a fix: the file is written anyway, but Astro never
 *   upscales, so the slot will ship it at that size. That is how the careers
 *   team photo went soft (parked-decisions §65). Off-ratio is a warning too:
 *   the component crops it with object-cover, so check heads and edges.
 * - Larger than the slot is resized down to the slot's width — that width is
 *   the biggest variant any component asks for, so extra pixels are only
 *   repo weight.
 * - Applies EXIF orientation, converts to sRGB (Figma files set to Display P3
 *   export P3) and strips metadata.
 * - Writes JPEG q92 with 4:4:4 chroma, so colour edges (type, logos inside a
 *   photo) don't blur before Astro's own pass. A file with real transparency
 *   stays PNG — JPEG would flatten it onto black.
 *
 * Only for images that go through <Image>. Anything in public/ (OG image,
 * favicons, careers trail tiles, the homepage hero shape) is served exactly
 * as exported and has its own spec in docs/images.md.
 *
 * Uses the sharp that Astro already installs for its image service.
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'
import { parseArgs } from 'node:util'

const INBOX = 'images-inbox'
const INPUT = /\.(png|jpe?g|webp|tiff?)$/i
// Figma anti-aliases a frame edge the image doesn't sit on to the exact
// pixel, which leaves a not-quite-opaque fringe along the border of a photo
// that has no real transparency. Anything confined to this many outer
// pixels counts as that fringe, not as transparency.
const FRINGE_PX = 2
const RATIO_TOLERANCE = 0.01
const JPEG = { quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }

// ratio is [w, h]; width is the "Recommended source" width in docs/images.md.
const SLOTS = {
  'team-photo': { ratio: [1, 1], width: 3840, out: 'src/assets/careers', label: 'Careers team photo' },
  'systems-hero': { ratio: [16, 9], width: 2560, out: 'src/assets/systems', label: 'Systems page hero' },
  'dual-cta': { ratio: [2000, 1618], width: 2000, out: 'src/assets/systems', label: 'Dual CTA card' },
  'system-card': { ratio: [1200, 882], width: 1200, out: 'src/assets/systems', label: 'System card' },
  'problem-card': { ratio: [860, 916], width: 860, out: 'src/assets/systems', label: 'Problem card' },
  'addon-card': { ratio: [3, 4], width: 720, out: 'src/assets/systems', label: 'Addon card' },
  'project-card': { ratio: [886, 580], width: 1800, out: 'src/assets/projects', label: 'Project card cover' },
  'project-cover': { ratio: [16, 9], width: 1920, out: 'src/assets/projects', label: 'Project detail cover' },
  'project-gallery': { ratio: [4, 3], width: 1600, out: 'src/assets/projects', label: 'Project gallery image' },
  'team-portrait': { ratio: [400, 524], width: 800, out: 'src/assets/people', label: 'Agency team portrait' },
  'inline-portrait': { ratio: [3, 4], width: 440, out: 'src/assets/people', label: 'Small inline portrait' },
  'podcast-thumb': { ratio: [430, 294], width: 860, out: 'src/assets/systems', label: 'Podcast/video thumbnail' },
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    slot: { type: 'string' },
    out: { type: 'string' },
    list: { type: 'boolean' },
  },
})

if (values.list) {
  for (const [name, s] of Object.entries(SLOTS)) {
    const height = Math.round((s.width * s.ratio[1]) / s.ratio[0])
    console.log(`${name.padEnd(16)} ${`${s.width}×${height}`.padEnd(10)} ${s.label}  →  ${s.out}`)
  }
  process.exit(0)
}

const slot = values.slot ? SLOTS[values.slot] : null
if (values.slot && !slot) {
  console.error(`Unknown slot "${values.slot}". Run with --list to see them.`)
  process.exit(1)
}

const outDir = values.out ?? slot?.out
if (!outDir) {
  console.error('Pass --out <folder>, or a --slot that has one (see --list).')
  process.exit(1)
}

function collect(paths) {
  return paths.flatMap((p) => {
    if (!existsSync(p)) {
      console.error(`Not found: ${p}`)
      return []
    }
    if (statSync(p).isDirectory()) {
      return readdirSync(p)
        .filter((f) => INPUT.test(f))
        .map((f) => join(p, f))
    }
    return [p]
  })
}

// The inbox is git-ignored, so a fresh clone doesn't have it — make it
// rather than reporting "Not found" for the default drop folder.
if (positionals.length === 0) mkdirSync(INBOX, { recursive: true })

const files = collect(positionals.length > 0 ? positionals : [INBOX])
if (files.length === 0) {
  console.error(`Nothing to convert. Drop Figma exports into ${INBOX}/ or pass file paths.`)
  process.exit(1)
}

/**
 * 'opaque', 'fringe' (see FRINGE_PX) or 'transparent'. The first real
 * Figma export this ran on (the careers team photo) was 'fringe': 2,706
 * pixels at alpha 250-254, all in column 0 — kept as PNG it came out 16MB.
 */
async function alphaKind(buffer) {
  if ((await sharp(buffer).stats()).isOpaque) return 'opaque'
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  for (let y = 0; y < h; y++) {
    const edgeRow = y < FRINGE_PX || y >= h - FRINGE_PX
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] === 255) continue
      if (!edgeRow && x >= FRINGE_PX && x < w - FRINGE_PX) return 'transparent'
    }
  }
  return 'fringe'
}

mkdirSync(outDir, { recursive: true })
const kb = (bytes) => `${Math.round(bytes / 1024)}KB`
let warnings = 0

for (const file of files) {
  const warn = (msg) => {
    warnings++
    console.log(`  ! ${msg}`)
  }

  // rotate() first so width/height below are the upright dimensions.
  const upright = await sharp(file).rotate().toBuffer({ resolveWithObject: true })
  const { width, height } = upright.info
  const name = basename(file, extname(file))
  const alpha = await alphaKind(upright.data)
  const opaque = alpha !== 'transparent'

  console.log(`${relative('.', file)}  ${width}×${height}`)

  let pipeline = sharp(upright.data).toColourspace('srgb')
  // removeAlpha, not flatten: the fringe pixels' colour is the photo's own,
  // so dropping the channel keeps them as they are instead of blending a
  // background into the edge.
  if (alpha === 'fringe') {
    pipeline = pipeline.removeAlpha()
    warn(`semi-transparent fringe on the outer ${FRINGE_PX}px only (the image isn't pixel-aligned in its Figma frame) — flattened`)
  }

  if (slot) {
    const want = slot.ratio[0] / slot.ratio[1]
    const got = width / height
    if (Math.abs(got - want) / want > RATIO_TOLERANCE) {
      warn(`ratio ${got.toFixed(3)} is not the slot's ${slot.ratio.join(':')} (${want.toFixed(3)}) — it will be cropped on the page`)
    }
    if (width < slot.width) {
      warn(`${width}px wide; the slot needs ${slot.width}px — it will ship soft on large Retina screens. Re-export at ${slot.width}w`)
    } else if (width > slot.width) {
      pipeline = pipeline.resize({ width: slot.width })
    }
  }

  const ext = opaque ? '.jpg' : '.png'
  if (!opaque) warn('has transparency, kept as PNG')
  const target = join(outDir, name + ext)

  const sibling = readdirSync(outDir).find((f) => basename(f, extname(f)) === name && extname(f) !== ext)
  if (sibling) warn(`${join(outDir, sibling)} also exists — update the import if it points there, then delete the old file`)

  const result = await (opaque ? pipeline.jpeg(JPEG) : pipeline.png({ compressionLevel: 9 })).toFile(target)
  console.log(`  → ${target}  ${result.width}×${result.height}  ${kb(result.size)}`)
}

console.log(`\n${files.length} file(s) written to ${outDir}${warnings ? `, ${warnings} warning(s) above` : ''}.`)
