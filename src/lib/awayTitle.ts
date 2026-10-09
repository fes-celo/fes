/**
 * Swaps the tab title while the page is in a background tab, and restores
 * it on return. Called once at module level, not from onPageLoad: a
 * bfcache restore keeps these listeners, so re-registering would stack them.
 * See docs/parked-decisions.md §74 for which pages use it and why so few.
 */
export function setAwayTitle(text: string, when: () => boolean = () => true) {
  const original = document.title
  // Unloading fires `visibilitychange` after `pagehide`; without this flag a
  // plain navigation would rename the history entry being left.
  let leaving = false

  window.addEventListener('pagehide', () => {
    leaving = true
  })
  window.addEventListener('pageshow', () => {
    leaving = false
    document.title = original
  })
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden && !leaving && when() ? text : original
  })
}
