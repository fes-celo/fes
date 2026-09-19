/**
 * Press feedback shared by every drag surface on the site (the testimonial
 * and team rows, the Systems problem cards, the add-on marquees): each card
 * shrinks toward its own centre while the pointer is down, so the gap
 * between cards visibly grows rather than the row scaling as one block.
 *
 * Lives apart from dragCarousel.ts on purpose. The marquees import this and
 * only this, and dragCarousel.ts is the module that pulls GSAP's Draggable
 * + InertiaPlugin in — importing the press helper from there used to drag
 * ~40KB of plugin into every page that only wanted a scale tween.
 */
import { gsap } from 'gsap'

export const PRESS_SCALE = 0.98
export const PRESS_DURATION = 0.2
export const PRESS_EASE = 'power2.out'

export function pressCards(cards: Element[], pressed: boolean) {
  gsap.to(cards, { scale: pressed ? PRESS_SCALE : 1, duration: PRESS_DURATION, ease: PRESS_EASE, overwrite: 'auto' })
}
