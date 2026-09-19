/**
 * Deletes files under dist/_astro/ that nothing in dist/ references.
 *
 * WHY. Astro copies every imported image's ORIGINAL file into dist/_astro/
 * and then, after generating the optimised variants, deletes the originals
 * that were "not referenced outside of image processing". Its notion of
 * "referenced" is a proxy that flags an image the moment any of its
 * metadata is read at render time — `.width`, `.format`, `.src` — and this
 * site's components read those constantly (ProjectCard branches on
 * `icon.format`, SelectedProjectsRotator sizes from `first.width`). In a
 * plain static build that keeps almost every original: 53 PNG/JPG sources,
 * 40MB, in a 27MB site — including a 12.6MB dashlane.png that no page
 * links to. (The Cloudflare adapter's SSR environment happened to bypass
 * the proxy, which is why the problem only surfaced when the adapter was
 * removed — see docs/parked-decisions.md.)
 *
 * WHAT. The ground truth is the output itself: a file under _astro/ that no
 * HTML, CSS, JS, XML or text file in dist/ mentions by name cannot be
 * fetched by anyone, so it is deleted. Names are matched both raw and
 * URL-encoded, because Astro writes `Start%20Inside%20Out.*.webp` into
 * srcset while the file on disk keeps its space.
 *
 * Runs after `astro build`, from `npm run build`, like build-redirects.mjs.
 */
import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = 'dist'
const ASSETS = join(DIST, '_astro')
const TEXT = /\.(html|css|js|mjs|xml|txt|json|webmanifest)$/i

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const all = walk(DIST)
const haystack = all
  .filter((f) => TEXT.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

const assets = walk(ASSETS)
let removed = 0
let removedBytes = 0
const kept = []

for (const file of assets) {
  const name = relative(ASSETS, file)
  const referenced = haystack.includes(name) || haystack.includes(encodeURI(name)) || haystack.includes(encodeURIComponent(name))
  if (referenced) {
    kept.push(file)
    continue
  }
  removedBytes += statSync(file).size
  unlinkSync(file)
  removed++
}

const keptBytes = kept.reduce((sum, f) => sum + statSync(f).size, 0)
const mb = (n) => (n / 1024 / 1024).toFixed(1) + 'MB'
console.log(`[assets] removed ${removed} unreferenced file(s) from ${ASSETS} (${mb(removedBytes)}); ${kept.length} kept (${mb(keptBytes)})`)
