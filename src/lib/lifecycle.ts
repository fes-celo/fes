/**
 * Page lifecycle for every client script on the site.
 *
 * The site used to ship Astro's `<ClientRouter />`, so every script bound
 * its setup to `astro:page-load` and its teardown to `astro:before-swap` —
 * the DOM was swapped in place on navigation and nothing was ever unloaded.
 * The router is gone (see docs/parked-decisions.md): no page uses a
 * `transition:*` directive, and a full navigation on a static site served
 * from a CDN is not slower than a fetch-and-swap — it just costs 16KB of
 * router and a lifecycle every component has to get right.
 *
 * Without the router the browser owns the lifecycle again, and only two
 * moments matter:
 *
 * - `onPageLoad(fn)`  — runs once the DOM is parsed (or immediately, if it
 *   already is). Module scripts are deferred, so registration always
 *   happens before DOMContentLoaded and callbacks run in registration
 *   order, exactly as the `astro:page-load` listeners did.
 * - `onPageUnload(fn)` — runs only when the page is about to enter the
 *   back/forward cache (`pagehide` with `persisted`), and `onPageLoad`
 *   callbacks run again when it is restored (`pageshow` with `persisted`).
 *   A page that is simply being discarded gets no teardown: there is
 *   nothing to leak into. This keeps the setup/teardown pairs every
 *   component already has meaningful — they are what make a bfcache
 *   restore come back with live scroll-triggers instead of frozen ones.
 */
/**
 * `restored` is true when the callback runs for a back/forward-cache
 * restore rather than a fresh load. Most setups don't care — they simply
 * run again. Entrance choreography does: a restored page is the page the
 * visitor just left, and replaying its load-in would snap content they
 * already saw to opacity 0 and animate it back in (see motion.ts).
 */
export interface LoadContext {
  restored: boolean
}

type LoadCallback = (ctx: LoadContext) => void
type Callback = () => void

const loads: LoadCallback[] = []
const unloads: Callback[] = []

let ready = document.readyState !== 'loading'

function run<Args extends unknown[]>(fns: Array<(...args: Args) => void>, ...args: Args) {
  for (const fn of fns) {
    try {
      fn(...args)
    } catch (error) {
      // One component's failure must not stop the others from initialising.
      console.error(error)
    }
  }
}

if (!ready) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      ready = true
      run(loads, { restored: false })
    },
    { once: true },
  )
}

window.addEventListener('pagehide', (event) => {
  if (event.persisted) run(unloads)
})

window.addEventListener('pageshow', (event) => {
  if (event.persisted) run(loads, { restored: true })
})

export function onPageLoad(fn: LoadCallback) {
  loads.push(fn)
  if (ready) fn({ restored: false })
}

export function onPageUnload(fn: Callback) {
  unloads.push(fn)
}
