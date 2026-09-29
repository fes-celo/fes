/// <reference types="@cloudflare/workers-types" />

/**
 * The site's one server route. Astro stays `output: 'static'` (dist/ is
 * plain files); this Worker sits in front of it, handles the two routes
 * that need server logic, and falls through to the static assets for
 * everything else. See docs/parked-decisions.md §54 for why this exists
 * as a plain Worker instead of the `@astrojs/cloudflare` adapter, and why
 * it's a Worker at all rather than a Pages Function (§35: this project
 * deploys with `wrangler deploy`, which never reads `functions/`).
 */

export interface Env {
  ASSETS: Fetcher
  LEADS: KVNamespace
  RESEND_API_KEY: string
  TURNSTILE_SECRET_KEY: string
}

const BOOKING_URL = 'https://calendar.app.google/GJ5i2k73FgB9p1iE9'
const CONTACT_TO = 'hello@fesagency.pt'
// The sender must be on a domain verified in Resend, and the one verified
// there is fes.agency, not fesagency.pt — only the recipient is on the
// site's own domain. Replies still reach the visitor via reply_to.
const CONTACT_FROM = 'FES Agency Website <noreply@fes.agency>'

const MESSAGE_MAX_LENGTH = 5000
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60
// GDPR art. 5(1)(e): a lead record may not live forever. Two years is the
// period the Privacy Policy promises (§ Contact requests) — change both
// together. KV deletes the key itself; nothing has to sweep it.
const LEAD_RETENTION_SECONDS = 60 * 60 * 24 * 730

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env)
    }
    if (url.pathname === '/go/booking') {
      return Response.redirect(BOOKING_URL, 302)
    }
    return env.ASSETS.fetch(request)
  },
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'invalid body' }, 400)
  }

  // Honeypot: a person never fills this in. Redirect exactly as a real
  // success would, so a bot gets no signal that it was caught.
  const thankYou = new URL('/contact/thank-you/', request.url).toString()
  if (form.get('website')) return Response.redirect(thankYou, 302)

  const name = asString(form.get('name'))
  const email = asString(form.get('email'))
  const message = asString(form.get('message'))?.slice(0, MESSAGE_MAX_LENGTH)
  const turnstileToken = asString(form.get('cf-turnstile-response'))

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return json({ error: 'invalid' }, 400)
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  if (await isRateLimited(env, ip)) {
    return json({ error: 'rate limited' }, 429)
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip)
  if (!turnstileOk) return json({ error: 'spam check failed' }, 400)

  const sent = await sendViaResend(env.RESEND_API_KEY, { name, email, message })
  // A failed send must NOT redirect to thank-you — that URL is the lead
  // metric (docs/measurement.md). The visitor needs to see a real error.
  if (!sent) return json({ error: 'send failed' }, 502)

  await env.LEADS.put(
    `lead:${crypto.randomUUID()}`,
    JSON.stringify({ timestamp: new Date().toISOString(), name, email, message }),
    { expirationTtl: LEAD_RETENTION_SECONDS },
  )

  return Response.redirect(thankYou, 302)
}

async function isRateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`
  const current = Number((await env.LEADS.get(key)) ?? '0')
  if (current >= RATE_LIMIT_MAX) return true
  await env.LEADS.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS })
  return false
}

async function verifyTurnstile(token: string | undefined, secret: string, ip: string): Promise<boolean> {
  if (!token) return false
  const body = new URLSearchParams({ secret, response: token, remoteip: ip })
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) return false
  const result = (await response.json()) as { success: boolean }
  return result.success === true
}

async function sendViaResend(
  apiKey: string,
  fields: { name: string; email: string; message: string },
): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      reply_to: fields.email,
      subject: `New contact form message from ${fields.name}`,
      text: `${fields.message}\n\n—\n${fields.name} <${fields.email}>`,
    }),
  })
  if (!response.ok) console.error('Resend send failed', response.status, await response.text())
  return response.ok
}

function asString(value: File | string | null): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || undefined
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
