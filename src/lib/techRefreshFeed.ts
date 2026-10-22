/**
 * Build-time covers for the Tech Refresh facades (parked-decisions §87).
 *
 * The page's players are click-to-load (§55), so before the click there is
 * no Spotify or YouTube artwork unless the site supplies its own. These
 * helpers run once per build: they read the podcast's public RSS feed (the
 * one Apple Podcasts lists for the show) and probe the YouTube thumbnail.
 * The URLs they return go to `<Image>`, which downloads and optimises the
 * file into dist/_astro — the visitor's browser never contacts Riverside,
 * Spotify or YouTube until it clicks.
 *
 * Every failure returns null and logs a warning instead of throwing: a feed
 * that is down must not stop a deploy. The page then renders the plain
 * facade it had before covers existed.
 */

const FEED_URL = 'https://api.riverside.com/hosting/txi05HBN.rss'
const TIMEOUT_MS = 10_000

export interface LatestEpisode {
  title: string
  /** e.g. "16 Oct 2026" */
  date: string
  /** ISO 8601, for <time datetime> */
  isoDate: string
  /** e.g. "32 min", or null when the feed has no duration */
  duration: string | null
  /** Episode artwork, falling back to the show's */
  image: string
}

async function fetchOk(url: string, method = 'GET'): Promise<Response | null> {
  try {
    const res = await fetch(url, { method, signal: AbortSignal.timeout(TIMEOUT_MS) })
    return res.ok ? res : null
  } catch {
    return null
  }
}

function text(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  if (!match) return null
  const raw = match[1].trim()
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/)
  if (cdata) return cdata[1].trim()
  return raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function imageHref(xml: string): string | null {
  return xml.match(/<itunes:image\s+href="([^"]+)"/)?.[1] ?? null
}

/** "00:32:22", "32:22" or "1942" (seconds) → "32 min" */
function formatDuration(raw: string | null): string | null {
  if (!raw) return null
  const parts = raw.split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  const seconds = parts.reduce((total, part) => total * 60 + part, 0)
  if (!seconds) return null
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

export async function getLatestEpisode(): Promise<LatestEpisode | null> {
  const res = await fetchOk(FEED_URL)
  if (!res) {
    console.warn(`[tech-refresh] podcast feed unreachable, using the plain facade: ${FEED_URL}`)
    return null
  }
  const xml = await res.text()
  const itemStart = xml.indexOf('<item>')
  const item = itemStart === -1 ? '' : xml.slice(itemStart, xml.indexOf('</item>', itemStart))
  const title = text(item, 'title')
  const pubDate = text(item, 'pubDate')
  const published = pubDate ? new Date(pubDate) : null
  // The channel's own <itunes:image> sits before the first <item>.
  const image = imageHref(item) ?? imageHref(xml.slice(0, Math.max(itemStart, 0)))
  if (!title || !published || Number.isNaN(published.getTime()) || !image) {
    console.warn('[tech-refresh] podcast feed has no usable latest episode, using the plain facade')
    return null
  }
  // <Image> throws on a remote image it cannot fetch, which would fail the build.
  if (!(await fetchOk(image, 'HEAD'))) {
    console.warn(`[tech-refresh] episode artwork unreachable, using the plain facade: ${image}`)
    return null
  }
  return {
    title,
    date: published.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    isoDate: published.toISOString(),
    duration: formatDuration(text(item, 'itunes:duration')),
    image,
  }
}

/** The largest thumbnail YouTube has for the video: the custom one when set in YouTube Studio. */
export async function getYouTubeThumbnail(videoId: string): Promise<string | null> {
  for (const name of ['maxresdefault', 'hqdefault']) {
    const url = `https://i.ytimg.com/vi/${videoId}/${name}.jpg`
    if (await fetchOk(url, 'HEAD')) return url
  }
  console.warn(`[tech-refresh] no YouTube thumbnail for ${videoId}, using the plain facade`)
  return null
}
