/**
 * The house easing curve, in the one place GSAP code imports it from.
 *
 * `--ease-out` in global.css (which is also what Tailwind's `ease-out`
 * utility resolves to) is `cubic-bezier(0.23, 1, 0.32, 1)`: a strong
 * ease-out that gets most of the way there in the first third of the
 * duration, so an entrance reads as arriving rather than drifting. GSAP's
 * `power4.out` is the same quint-out shape — close enough that the two can't
 * be told apart side by side — and is built into core, so matching the CSS
 * curve costs no CustomEase plugin bytes.
 *
 * Use it for anything entering OR leaving. Exits start fast too: an
 * ease-in exit holds still for the first half of its duration, which is the
 * exact moment the visitor is waiting for the thing to get out of the way.
 * Scroll-scrubbed and constant motion keep `ease: 'none'`.
 */
export const EASE_OUT = 'power4.out'
