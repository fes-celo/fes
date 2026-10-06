/**
 * Generates dist/_redirects from docs/redirect-map.csv.
 *
 * WHY A SCRIPT. The CSV is the source of truth — 185 rows with the GSC
 * traffic behind each one — and it is maintained by hand. Copying it into a
 * hand-written _redirects would mean two files that drift, and the failure
 * mode of that drift is silent: a redirect pointing at a URL that doesn't
 * exist turns a 404 into a 301-to-404, which is worse than the 404 it
 * replaced. Google treats a redirect to a dead page as a soft 404 and, unlike
 * a plain 404, it looks deliberate.
 *
 * So every row is checked against the pages that were ACTUALLY built, and a
 * row whose target isn't there is skipped and reported rather than emitted.
 * The skipped list is the launch checklist. The one exception is an old
 * case study (/projects/<slug>/) that isn't rebuilt yet: it gets a temporary
 * 302 to the /projects/ hub, and turns into a 301 to its own page on the
 * first build after that page lands, with no edit here.
 *
 * WHY POSTBUILD. It reads dist to know which routes exist, so it can't
 * live in public/ (that's copied *during* the build). Wired as the second
 * half of `npm run build`.
 *
 * WHAT IT CAN'T DO. _redirects matches on PATH only. Two rows differ from
 * their target by hostname rather than path — the http/www variant of the
 * homepage and the ptwebsummit2019 subdomain — and those belong in
 * Cloudflare's zone-level Redirect Rules, not here. They're reported under
 * "needs zone config" so they don't get quietly lost.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CSV = 'docs/redirect-map.csv'
const OUT_DIR = 'dist'
const OUT = join(OUT_DIR, '_redirects')
const SITE_HOST = 'fesagency.pt'

// Minimal CSV reader: the file has quoted fields containing commas (the
// `notes` column), so a split(',') would mis-parse it.
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows.filter((r) => r.some((f) => f !== ''))
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

// Every directory in the build that holds an index.html is a live route.
function builtRoutes(dir, base = '', out = new Set()) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) builtRoutes(full, `${base}/${entry}`, out)
    else if (entry === 'index.html') out.add(`${base}/` || '/')
  }
  return out
}

const rows = parseCsv(readFileSync(CSV, 'utf8'))
const routes = builtRoutes(OUT_DIR)
routes.add('/')

const emit = []
const skipped = { noTarget: [], zoneConfig: [], noop: [], unresolved: [], retired: [] }
const held = [] // old case studies parked on /projects/ with a 302 — see below
const seen = new Set()

for (const r of rows) {
  const to = r.new_url
  const impressions = Number(r.impressions || 0)

  // RETIRE: the old page is deliberately let go. A plain 404 is the honest
  // answer for it, so no redirect is emitted (parked-decisions §71).
  if (to === 'RETIRE') { skipped.retired.push([r.old_url, to, impressions]); continue }
  if (!to.startsWith('/')) { skipped.unresolved.push([r.old_url, to, impressions]); continue }

  let url
  try { url = new URL(r.old_url) } catch { skipped.unresolved.push([r.old_url, to, impressions]); continue }

  if (url.hostname !== SITE_HOST) { skipped.zoneConfig.push([r.old_url, to, impressions]); continue }

  const from = url.pathname
  if (from === to) { skipped.noop.push([from, to, impressions]); continue }
  let target = to
  let status = 301
  if (!routes.has(to)) {
    // An old case study that may come back with its own page: park it on the
    // /projects/ hub with a TEMPORARY 302, so the day /projects/<slug>/ is
    // built this row turns into a permanent 301 to it with no CSV edit
    // (parked-decisions §71). Anything else with no target is still skipped.
    if (!/^\/projects\/[^/]+\/$/.test(to)) { skipped.noTarget.push([from, to, impressions]); continue }
    target = '/projects/'
    status = 302
  }
  if (seen.has(from)) continue
  seen.add(from)
  emit.push({ from, to: target, status, impressions })
  if (status === 302) held.push([from, to, impressions])
}

// Longest source path first. All of these are exact paths so first-match
// order is not load-bearing today, but it keeps the file stable across runs
// and stays correct if a splat is ever added by hand below.
emit.sort((a, b) => b.from.length - a.from.length || a.from.localeCompare(b.from))

const width = Math.max(...emit.map((e) => e.from.length), 0)
const header = `# GENERATED by tools/build-redirects.mjs — do not edit.
# Source of truth: docs/redirect-map.csv. Re-run with \`npm run build\`.
#
# ${emit.length} of ${rows.length} rows emitted. A row is skipped when its target
# doesn't exist in the build, so this file can never 301 into a 404.
# 302s are old case studies parked on /projects/ until their own page exists.
`
writeFileSync(OUT, `${header}\n${emit.map((e) => `${e.from.padEnd(width)}  ${e.to}  ${e.status}`).join('\n')}\n`)

const sum = (list) => list.reduce((n, [, , i]) => n + i, 0)
console.log(`\n[redirects] ${emit.length}/${rows.length} rows -> ${OUT}  (${sum(emit.map((e) => [0, 0, e.impressions])).toLocaleString()} impressions covered)`)
if (held.length) console.log(`[redirects]   of which ${String(held.length).padStart(2)} — old case studies parked on /projects/ with a 302 (${sum(held).toLocaleString()} impressions)`)
for (const [label, list] of [
  ['target not built yet', skipped.noTarget],
  ['unresolved in the CSV', skipped.unresolved],
  ['needs Cloudflare zone config (hostname, not path)', skipped.zoneConfig],
  ['already correct, no redirect needed', skipped.noop],
  ['retired on purpose, left to 404', skipped.retired],
]) {
  if (list.length) console.log(`[redirects]   skipped ${String(list.length).padStart(3)} — ${label} (${sum(list).toLocaleString()} impressions)`)
}
console.log('')
