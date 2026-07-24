# Lead Measurement — Taxonomy & Decision Record

Status: decided in Phase 0A. Implementation is Phase 3 (Contact & the Conversion Chain). This document freezes *what* counts and *where* it lives so Phase 3 is a build task, not a design task.

## Why this model exists

Cloudflare Web Analytics (the analytics tool already chosen for this project) is pageview-only — it cannot track custom events like a button click or a form submit. So "lead" cannot be a JS event. Instead, every lead action is routed through a **URL that only gets loaded when the lead action actually completes**. The pageview on that URL *is* the conversion signal. This works with any pageview analytics tool, has no vendor lock-in, and needs no client-side event-tracking code.

A server-side record is kept in parallel (see below) so lead counts survive even if analytics has an outage or a blocker (ad blockers, Do Not Track) suppresses the client-side ping.

## What counts as a lead

Two lead types, both tracked the same way — a dedicated URL that only renders/redirects on completion of the action:

| Lead type | Trigger | Tracked URL | Mechanism |
|---|---|---|---|
| Form submission | Visitor submits the Contact form | `/contact/thank-you` | Pages Function validates the submission (Turnstile passed, required fields present), sends the email, stores the record, then issues a 302 to this URL. The page only ever loads after a real successful submission. |
| Booking click | Visitor clicks the "book a call" / scheduling link | `/go/booking` | Every booking CTA on the site links to this internal path instead of the scheduling provider's URL directly. It 302s straight through to the real scheduling page. The pageview on `/go/booking` fires before the redirect completes. |

Nothing else counts as a lead for v1 measurement purposes. Newsletter signups, resource downloads, etc. are out of scope unless a future phase adds an equivalent thank-you-style URL for them.

## Why routed indirection instead of linking out directly

`/go/booking` exists so that:
1. The click is measurable via a pageview, without custom JS events.
2. Swapping the scheduling provider later is a one-line redirect-target edit, not a site-wide link update.

## Server-side counts (the record that survives an analytics outage)

The Contact form's Pages Function, in addition to sending the email via Resend, writes a minimal record on every submission:

- Timestamp
- Name
- Email
- Message

This is the authoritative lead log — it exists independent of whether Cloudflare Web Analytics captured the pageview, whether the visitor has an ad blocker, or whether analytics itself is down. Where this record is physically stored (flat file vs. KV vs. a future Supabase table) is a Phase 3 implementation detail, not a Phase 0A decision — the decision being frozen here is *that it exists and what fields it carries*, not the storage backend.

`/go/booking` does not currently have an equivalent server-side record — it is a pure redirect. If booking-click volume becomes a metric worth reconciling against analytics (the same way the email record backs up the form count), add a lightweight log write to that Function in Phase 3 rather than treating this as settled.

## What "did it work" looks like operationally

- **Form leads** = count of pageviews on `/contact/thank-you` in Cloudflare Web Analytics, cross-checked against the count of stored records / received emails.
- **Booking leads** = count of pageviews on `/go/booking` in Cloudflare Web Analytics.
- Both are watched daily during the Phase 6 launch/cutover week, per that phase's checkpoint ("at least one real lead through the chain").

## Explicitly out of scope for this doc

- Provider selection for the booking tool (Open Question #4 in the roadmap) — `/go/booking` absorbs whatever provider is chosen without needing to revisit this taxonomy.
- Any analytics beyond Cloudflare Web Analytics (e.g. adding a second tool) — not assumed or required by this model.
